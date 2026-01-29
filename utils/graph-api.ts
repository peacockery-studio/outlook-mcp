/**
 * Microsoft Graph API helper functions
 */
import config from "../config";
import type { GraphApiQueryParams, HttpMethod } from "../types";
import { simulateGraphAPIResponse } from "./mock-data";

/**
 * Makes a request to the Microsoft Graph API
 * @param accessToken - The access token for authentication
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - API endpoint path
 * @param data - Data to send for POST/PUT requests
 * @param queryParams - Query parameters
 * @returns The API response
 */
export async function callGraphAPI<T = unknown>(
	accessToken: string,
	method: HttpMethod,
	path: string,
	data: unknown = null,
	queryParams: GraphApiQueryParams = {},
): Promise<T> {
	// For test tokens, we'll simulate the API call
	if (config.USE_TEST_MODE && accessToken.startsWith("test_access_token_")) {
		console.error(`TEST MODE: Simulating ${method} ${path} API call`);
		return simulateGraphAPIResponse(method, path, data, queryParams) as T;
	}

	console.error(`Making real API call: ${method} ${path}`);

	// Check if path already contains the full URL (from nextLink)
	let finalUrl: string;
	if (path.startsWith("http://") || path.startsWith("https://")) {
		// Path is already a full URL (from pagination nextLink)
		finalUrl = path;
		console.error(`Using full URL from nextLink: ${finalUrl}`);
	} else {
		// Build URL from path and queryParams
		// Encode path segments properly
		const encodedPath = path
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");

		// Build query string from parameters with special handling for OData filters
		let queryString = "";
		if (Object.keys(queryParams).length > 0) {
			// Handle $filter parameter specially to ensure proper URI encoding
			const filter = queryParams.$filter;
			if (filter) {
				const paramsWithoutFilter = { ...queryParams };
				delete paramsWithoutFilter.$filter;

				// Build query string with proper encoding for regular params
				const params = new URLSearchParams();
				for (const [key, value] of Object.entries(paramsWithoutFilter)) {
					if (value !== undefined) {
						params.append(key, String(value));
					}
				}

				queryString = params.toString();

				// Add filter parameter separately with proper encoding
				if (queryString) {
					queryString += `&$filter=${encodeURIComponent(filter)}`;
				} else {
					queryString = `$filter=${encodeURIComponent(filter)}`;
				}
			} else {
				// Build query string with proper encoding for all params
				const params = new URLSearchParams();
				for (const [key, value] of Object.entries(queryParams)) {
					if (value !== undefined) {
						params.append(key, String(value));
					}
				}
				queryString = params.toString();
			}

			if (queryString) {
				queryString = `?${queryString}`;
			}

			console.error(`Query string: ${queryString}`);
		}

		finalUrl = `${config.GRAPH_API_ENDPOINT}${encodedPath}${queryString}`;
		console.error(`Full URL: ${finalUrl}`);
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		"Content-Type": "application/json",
	};

	const hasBody =
		data && (method === "POST" || method === "PATCH" || method === "PUT");

	const response = await fetch(finalUrl, {
		method,
		headers,
		body: hasBody ? JSON.stringify(data) : undefined,
	});

	if (response.status === 401) {
		throw new Error("UNAUTHORIZED");
	}

	if (!response.ok) {
		const responseText = await response.text();
		throw new Error(
			`API call failed with status ${response.status}: ${responseText}`,
		);
	}

	const responseText = await response.text();
	const jsonData = responseText || "{}";

	try {
		return JSON.parse(jsonData) as T;
	} catch (error) {
		const parseError = error as Error;
		throw new Error(`Error parsing API response: ${parseError.message}`);
	}
}

/**
 * Response type for paginated results
 */
interface PaginatedResponse<T> {
	value: T[];
	"@odata.nextLink"?: string;
	"@odata.count"?: number;
}

/**
 * Calls Graph API with pagination support to retrieve all results up to maxCount
 * @param accessToken - The access token for authentication
 * @param method - HTTP method (GET only for pagination)
 * @param path - API endpoint path
 * @param queryParams - Initial query parameters
 * @param maxCount - Maximum number of items to retrieve (0 = all)
 * @returns Combined API response with all items
 */
export async function callGraphAPIPaginated<T>(
	accessToken: string,
	method: HttpMethod,
	path: string,
	queryParams: GraphApiQueryParams = {},
	maxCount = 0,
): Promise<PaginatedResponse<T>> {
	if (method !== "GET") {
		throw new Error("Pagination only supports GET requests");
	}

	const allItems: T[] = [];
	let nextLink: string | undefined;
	let currentUrl = path;
	let currentParams = queryParams;

	do {
		// Make API call
		const response = await callGraphAPI<PaginatedResponse<T>>(
			accessToken,
			method,
			currentUrl,
			null,
			currentParams,
		);

		// Add items from this page
		if (response.value && Array.isArray(response.value)) {
			allItems.push(...response.value);
			console.error(
				`Pagination: Retrieved ${response.value.length} items, total so far: ${allItems.length}`,
			);
		}

		// Check if we've reached the desired count
		if (maxCount > 0 && allItems.length >= maxCount) {
			console.error(`Pagination: Reached max count of ${maxCount}, stopping`);
			break;
		}

		// Get next page URL
		nextLink = response["@odata.nextLink"];

		if (nextLink) {
			// Pass the full nextLink URL directly to callGraphAPI
			currentUrl = nextLink;
			currentParams = {}; // nextLink already contains all params
			console.error(
				`Pagination: Following nextLink, ${allItems.length} items so far`,
			);
		}
	} while (nextLink);

	// Trim to exact count if needed
	const finalItems = maxCount > 0 ? allItems.slice(0, maxCount) : allItems;

	console.error(
		`Pagination complete: Retrieved ${finalItems.length} total items`,
	);

	return {
		value: finalItems,
		"@odata.count": finalItems.length,
	};
}
