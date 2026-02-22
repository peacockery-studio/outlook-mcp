/**
 * List contacts functionality
 */

import { ensureAuthenticated } from "../auth";
import { CONTACT_SELECT_FIELDS, DEFAULT_PAGE_SIZE, MAX_RESULT_COUNT } from "../config";
import { callGraphAPI } from "../utils/graph-api";

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
	isError?: boolean;
}

/**
 * Arguments for list contacts handler
 */
interface ListContactsArgs {
	mailbox?: string;
	search?: string;
	count?: number;
}

/**
 * Contact email address from Graph API
 */
interface ContactEmail {
	address: string;
	name?: string;
}

/**
 * Contact structure from Graph API
 */
interface GraphContact {
	id: string;
	displayName: string;
	givenName?: string;
	surname?: string;
	emailAddresses?: ContactEmail[];
	businessPhones?: string[];
	mobilePhone?: string;
	companyName?: string;
	jobTitle?: string;
	department?: string;
}

/**
 * Graph API response for contacts
 */
interface GraphContactsResponse {
	value: GraphContact[];
}

/**
 * List contacts handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleListContacts(
	args: ListContactsArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { search } = args;
	const requestedCount = Math.min(
		args.count ?? DEFAULT_PAGE_SIZE,
		MAX_RESULT_COUNT,
	);

	try {
		const accessToken = await ensureAuthenticated();

		const queryParams: Record<string, string | number | boolean | undefined> = {
			$select: CONTACT_SELECT_FIELDS,
			$top: requestedCount,
			$orderby: "displayName",
		};

		if (search) {
			queryParams.$search = `"${search}"`;
			// Cannot combine $search with $orderby for contacts
			delete queryParams.$orderby;
		}

		const response = await callGraphAPI<GraphContactsResponse>(
			accessToken,
			"GET",
			`users/${mailbox}/contacts`,
			null,
			queryParams,
		);

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: search
							? `No contacts found matching "${search}".`
							: "No contacts found.",
					},
				],
			};
		}

		const contactList = response.value
			.map((contact, index) => {
				const emails =
					contact.emailAddresses && contact.emailAddresses.length > 0
						? contact.emailAddresses
								.map((e) => e.address)
								.join(", ")
						: "No email";
				const phones: string[] = [];
				if (contact.businessPhones && contact.businessPhones.length > 0) {
					phones.push(...contact.businessPhones.map((p) => `Work: ${p}`));
				}
				if (contact.mobilePhone) {
					phones.push(`Mobile: ${contact.mobilePhone}`);
				}
				const phoneStr =
					phones.length > 0 ? phones.join(", ") : "No phone";
				const company = contact.companyName
					? ` | ${contact.companyName}`
					: "";
				const title = contact.jobTitle ? ` (${contact.jobTitle})` : "";

				return `${index + 1}. ${contact.displayName}${title}${company}\n   Email: ${emails}\n   Phone: ${phoneStr}\n   ID: ${contact.id}`;
			})
			.join("\n\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${response.value.length} contacts:\n\n${contactList}`,
				},
			],
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		if (errorMessage === "Authentication required") {
			return {
				content: [
					{
						type: "text",
						text: "Authentication required. Please use the 'authenticate' tool first.",
					},
				],
				isError: true,
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error listing contacts: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleListContacts;
