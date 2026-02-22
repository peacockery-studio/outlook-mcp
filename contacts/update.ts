/**
 * Update contact functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
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
 * Arguments for update contact handler
 */
interface UpdateContactArgs {
	mailbox?: string;
	contactId?: string;
	givenName?: string;
	surname?: string;
	emailAddresses?: string;
	businessPhones?: string;
	mobilePhone?: string;
	companyName?: string;
	jobTitle?: string;
	department?: string;
}

/**
 * Contact body for Graph API
 */
interface GraphContactBody {
	givenName?: string;
	surname?: string;
	emailAddresses?: Array<{ address: string; name: string }>;
	businessPhones?: string[];
	mobilePhone?: string;
	companyName?: string;
	jobTitle?: string;
	department?: string;
}

/**
 * Updated contact response from Graph API
 */
interface GraphContactResponse {
	id: string;
	displayName: string;
}

/**
 * Update contact handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleUpdateContact(
	args: UpdateContactArgs,
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

	// Check if the mailbox has permission to modify
	if (!canModifyMailbox(mailbox)) {
		return {
			content: [
				{
					type: "text",
					text: `Updating contacts is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Build partial body with only provided fields
		const body: GraphContactBody = {};

		if (args.givenName) body.givenName = args.givenName;
		if (args.surname) body.surname = args.surname;
		if (args.companyName) body.companyName = args.companyName;
		if (args.jobTitle) body.jobTitle = args.jobTitle;
		if (args.department) body.department = args.department;
		if (args.mobilePhone) body.mobilePhone = args.mobilePhone;

		if (args.emailAddresses) {
			body.emailAddresses = args.emailAddresses
				.split(",")
				.map((email) => ({
					address: email.trim(),
					name: "",
				}));
		}

		if (args.businessPhones) {
			body.businessPhones = args.businessPhones
				.split(",")
				.map((phone) => phone.trim());
		}

		const response = await callGraphAPI<GraphContactResponse>(
			accessToken,
			"PATCH",
			`users/${mailbox}/contacts/${contactId}`,
			body,
		);

		return {
			content: [
				{
					type: "text",
					text: `Contact updated successfully!\n\nName: ${response.displayName}\nID: ${response.id}`,
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
					text: `Error updating contact: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleUpdateContact;
