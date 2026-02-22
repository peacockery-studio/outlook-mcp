/**
 * Create contact functionality
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
 * Arguments for create contact handler
 */
interface CreateContactArgs {
	mailbox?: string;
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
 * Created contact response from Graph API
 */
interface GraphContactResponse {
	id: string;
	displayName: string;
	givenName?: string;
	surname?: string;
}

/**
 * Create contact handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleCreateContact(
	args: CreateContactArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	// Check if the mailbox has permission to modify
	if (!canModifyMailbox(mailbox)) {
		return {
			content: [
				{
					type: "text",
					text: `Creating contacts is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Build contact body with only provided fields
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
			"POST",
			`users/${mailbox}/contacts`,
			body,
		);

		return {
			content: [
				{
					type: "text",
					text: `Contact created successfully!\n\nName: ${response.displayName}\nID: ${response.id}`,
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
					text: `Error creating contact: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleCreateContact;
