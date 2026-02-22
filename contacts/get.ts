/**
 * Get contact details functionality
 */

import { ensureAuthenticated } from "../auth";
import { CONTACT_SELECT_FIELDS } from "../config";
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
 * Arguments for get contact handler
 */
interface GetContactArgs {
	mailbox?: string;
	contactId?: string;
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
 * Get contact handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleGetContact(
	args: GetContactArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const contactId = args.contactId;
	if (!contactId) {
		return {
			content: [
				{
					type: "text",
					text: "Contact ID is required.",
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const contact = await callGraphAPI<GraphContact>(
			accessToken,
			"GET",
			`users/${mailbox}/contacts/${contactId}`,
			null,
			{ $select: CONTACT_SELECT_FIELDS },
		);

		const emails =
			contact.emailAddresses && contact.emailAddresses.length > 0
				? contact.emailAddresses
						.map((e) => `${e.address}${e.name ? ` (${e.name})` : ""}`)
						.join("\n   ")
				: "None";

		const phones: string[] = [];
		if (contact.businessPhones && contact.businessPhones.length > 0) {
			for (const p of contact.businessPhones) {
				phones.push(`Business: ${p}`);
			}
		}
		if (contact.mobilePhone) {
			phones.push(`Mobile: ${contact.mobilePhone}`);
		}
		const phoneStr = phones.length > 0 ? phones.join("\n   ") : "None";

		const details = [
			`Name: ${contact.displayName}`,
			contact.givenName ? `First Name: ${contact.givenName}` : null,
			contact.surname ? `Last Name: ${contact.surname}` : null,
			`Email(s):\n   ${emails}`,
			`Phone(s):\n   ${phoneStr}`,
			contact.companyName ? `Company: ${contact.companyName}` : null,
			contact.jobTitle ? `Job Title: ${contact.jobTitle}` : null,
			contact.department ? `Department: ${contact.department}` : null,
			`ID: ${contact.id}`,
		]
			.filter(Boolean)
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Contact Details:\n\n${details}`,
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
					text: `Error getting contact: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleGetContact;
