/**
 * Improved search emails functionality
 */

import { ensureAuthenticated } from "../auth";
import config from "../config";
import { callGraphAPIPaginated } from "../utils/graph-api";
import { resolveFolderPath } from "./folder-utils";

/**
 * MCP response content item
 */
interface MCPContentItem {
	type: "text";
	text: string;
}

/**
 * MCP response structure
 */
interface MCPResponse {
	content: MCPContentItem[];
}

/**
 * Arguments for search emails handler
 */
interface SearchEmailsArgs {
	query?: string;
	folder?: string;
	from?: string;
	to?: string;
	subject?: string;
	hasAttachments?: boolean;
	unreadOnly?: boolean;
	count?: number;
}

/**
 * Search terms structure
 */
interface SearchTerms {
	query: string;
	from: string;
	to: string;
	subject: string;
}

/**
 * Filter terms structure
 */
interface FilterTerms {
	hasAttachments?: boolean;
	unreadOnly?: boolean;
}

/**
 * Query parameters structure
 */
interface QueryParams {
	[key: string]: string | number | boolean | undefined;
	$top: number;
	$select: string;
	$orderby: string;
	$search?: string;
	$filter?: string;
}

/**
 * Search info structure
 */
interface SearchInfo {
	attemptsCount: number;
	strategies: string[];
	originalTerms: SearchTerms;
	filterTerms: FilterTerms;
}

/**
 * Email address structure from Graph API
 */
interface EmailAddress {
	name: string;
	address: string;
}

/**
 * Email structure from Graph API
 */
interface GraphEmail {
	id: string;
	subject: string;
	from?: { emailAddress: EmailAddress };
	receivedDateTime: string;
	isRead: boolean;
}

/**
 * Graph API search response
 */
interface GraphSearchResponse {
	value: GraphEmail[];
	"@odata.count"?: number;
	_searchInfo?: SearchInfo;
}

/**
 * Search emails handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleSearchEmails(
	args: SearchEmailsArgs,
): Promise<MCPResponse> {
	const folder = args.folder ?? "inbox";
	const requestedCount = args.count ?? 10;
	const query = args.query ?? "";
	const from = args.from ?? "";
	const to = args.to ?? "";
	const subject = args.subject ?? "";
	const hasAttachments = args.hasAttachments;
	const unreadOnly = args.unreadOnly;

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Resolve the folder path
		const endpoint = await resolveFolderPath(accessToken, folder);
		console.error(`Using endpoint: ${endpoint} for folder: ${folder}`);

		// Execute progressive search with pagination
		const response = await progressiveSearch(
			endpoint,
			accessToken,
			{ query, from, to, subject },
			{ hasAttachments, unreadOnly },
			requestedCount,
		);

		return formatSearchResults(response);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		// Handle authentication errors
		if (errorMessage === "Authentication required") {
			return {
				content: [
					{
						type: "text",
						text: "Authentication required. Please use the 'authenticate' tool first.",
					},
				],
			};
		}

		// General error response
		return {
			content: [
				{
					type: "text",
					text: `Error searching emails: ${errorMessage}`,
				},
			],
		};
	}
}

/**
 * Execute a search with progressively simpler fallback strategies
 * @param endpoint - API endpoint
 * @param accessToken - Access token
 * @param searchTerms - Search terms (query, from, to, subject)
 * @param filterTerms - Filter terms (hasAttachments, unreadOnly)
 * @param maxCount - Maximum number of results to retrieve
 * @returns Search results
 */
async function progressiveSearch(
	endpoint: string,
	accessToken: string,
	searchTerms: SearchTerms,
	filterTerms: FilterTerms,
	maxCount: number,
): Promise<GraphSearchResponse> {
	// Track search strategies attempted
	const searchAttempts: string[] = [];

	// 1. Try combined search (most specific)
	try {
		const params = buildSearchParams(
			searchTerms,
			filterTerms,
			Math.min(50, maxCount),
		);
		console.error("Attempting combined search with params:", params);
		searchAttempts.push("combined-search");

		const response = (await callGraphAPIPaginated(
			accessToken,
			"GET",
			endpoint,
			params,
			maxCount,
		)) as GraphSearchResponse;
		if (response.value && response.value.length > 0) {
			console.error(
				`Combined search successful: found ${response.value.length} results`,
			);
			return response;
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Combined search failed: ${errorMessage}`);
	}

	// 2. Try each search term individually, starting with most specific
	const searchPriority: Array<keyof SearchTerms> = [
		"subject",
		"from",
		"to",
		"query",
	];

	for (const term of searchPriority) {
		if (searchTerms[term]) {
			try {
				console.error(
					`Attempting search with only ${term}: "${searchTerms[term]}"`,
				);
				searchAttempts.push(`single-term-${term}`);

				// For single term search, only use $search with that term
				const simplifiedParams: QueryParams = {
					$top: Math.min(50, maxCount),
					$select: config.EMAIL_SELECT_FIELDS,
					$orderby: "receivedDateTime desc",
				};

				// Add the search term in the appropriate KQL syntax
				if (term === "query") {
					// General query doesn't need a prefix
					simplifiedParams.$search = `"${searchTerms[term]}"`;
				} else {
					// Specific field searches use field:value syntax
					simplifiedParams.$search = `${term}:"${searchTerms[term]}"`;
				}

				// Add boolean filters if applicable
				addBooleanFilters(simplifiedParams, filterTerms);

				const response = (await callGraphAPIPaginated(
					accessToken,
					"GET",
					endpoint,
					simplifiedParams,
					maxCount,
				)) as GraphSearchResponse;
				if (response.value && response.value.length > 0) {
					console.error(
						`Search with ${term} successful: found ${response.value.length} results`,
					);
					return response;
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(`Search with ${term} failed: ${errorMessage}`);
			}
		}
	}

	// 3. Try with only boolean filters
	if (filterTerms.hasAttachments === true || filterTerms.unreadOnly === true) {
		try {
			console.error("Attempting search with only boolean filters");
			searchAttempts.push("boolean-filters-only");

			const filterOnlyParams: QueryParams = {
				$top: Math.min(50, maxCount),
				$select: config.EMAIL_SELECT_FIELDS,
				$orderby: "receivedDateTime desc",
			};

			// Add the boolean filters
			addBooleanFilters(filterOnlyParams, filterTerms);

			const response = (await callGraphAPIPaginated(
				accessToken,
				"GET",
				endpoint,
				filterOnlyParams,
				maxCount,
			)) as GraphSearchResponse;
			console.error(
				`Boolean filter search found ${response.value?.length ?? 0} results`,
			);
			return response;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(`Boolean filter search failed: ${errorMessage}`);
		}
	}

	// 4. Final fallback: just get recent emails with pagination
	console.error("All search strategies failed, falling back to recent emails");
	searchAttempts.push("recent-emails");

	const basicParams: QueryParams = {
		$top: Math.min(50, maxCount),
		$select: config.EMAIL_SELECT_FIELDS,
		$orderby: "receivedDateTime desc",
	};

	const response = (await callGraphAPIPaginated(
		accessToken,
		"GET",
		endpoint,
		basicParams,
		maxCount,
	)) as GraphSearchResponse;
	console.error(
		`Fallback to recent emails found ${response.value?.length ?? 0} results`,
	);

	// Add a note to the response about the search attempts
	response._searchInfo = {
		attemptsCount: searchAttempts.length,
		strategies: searchAttempts,
		originalTerms: searchTerms,
		filterTerms: filterTerms,
	};

	return response;
}

/**
 * Build search parameters from search terms and filter terms
 * @param searchTerms - Search terms (query, from, to, subject)
 * @param filterTerms - Filter terms (hasAttachments, unreadOnly)
 * @param count - Maximum number of results
 * @returns Query parameters
 */
function buildSearchParams(
	searchTerms: SearchTerms,
	filterTerms: FilterTerms,
	count: number,
): QueryParams {
	const params: QueryParams = {
		$top: count,
		$select: config.EMAIL_SELECT_FIELDS,
		$orderby: "receivedDateTime desc",
	};

	// Handle search terms
	const kqlTerms: string[] = [];

	if (searchTerms.query) {
		// General query doesn't need a prefix
		kqlTerms.push(searchTerms.query);
	}

	if (searchTerms.subject) {
		kqlTerms.push(`subject:"${searchTerms.subject}"`);
	}

	if (searchTerms.from) {
		kqlTerms.push(`from:"${searchTerms.from}"`);
	}

	if (searchTerms.to) {
		kqlTerms.push(`to:"${searchTerms.to}"`);
	}

	// Add $search if we have any search terms
	if (kqlTerms.length > 0) {
		params.$search = kqlTerms.join(" ");
	}

	// Add boolean filters
	addBooleanFilters(params, filterTerms);

	return params;
}

/**
 * Add boolean filters to query parameters
 * @param params - Query parameters
 * @param filterTerms - Filter terms (hasAttachments, unreadOnly)
 */
function addBooleanFilters(
	params: QueryParams,
	filterTerms: FilterTerms,
): void {
	const filterConditions: string[] = [];

	if (filterTerms.hasAttachments === true) {
		filterConditions.push("hasAttachments eq true");
	}

	if (filterTerms.unreadOnly === true) {
		filterConditions.push("isRead eq false");
	}

	// Add $filter parameter if we have any filter conditions
	if (filterConditions.length > 0) {
		params.$filter = filterConditions.join(" and ");
	}
}

/**
 * Format search results into a readable text format
 * @param response - The API response object
 * @returns MCP response object
 */
function formatSearchResults(response: GraphSearchResponse): MCPResponse {
	if (!response.value || response.value.length === 0) {
		return {
			content: [
				{
					type: "text",
					text: "No emails found matching your search criteria.",
				},
			],
		};
	}

	// Format results
	const emailList = response.value
		.map((email, index) => {
			const sender = email.from?.emailAddress ?? {
				name: "Unknown",
				address: "unknown",
			};
			const date = new Date(email.receivedDateTime).toLocaleString();
			const readStatus = email.isRead ? "" : "[UNREAD] ";

			return `${index + 1}. ${readStatus}${date} - From: ${sender.name} (${sender.address})\nSubject: ${email.subject}\nID: ${email.id}\n`;
		})
		.join("\n");

	// Add search strategy info if available
	let additionalInfo = "";
	if (response._searchInfo) {
		additionalInfo = `\n(Search used ${response._searchInfo.strategies[response._searchInfo.strategies.length - 1]} strategy)`;
	}

	return {
		content: [
			{
				type: "text",
				text: `Found ${response.value.length} emails matching your search criteria:${additionalInfo}\n\n${emailList}`,
			},
		],
	};
}

export default handleSearchEmails;
