/**
 * Delete contact functionality
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
 * Arguments for delete contact handler
 */
interface DeleteContactArgs {
	mailbox?: string;
	contactId?: string;
}

/**
 * Delete contact handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleDeleteContact(
	args: DeleteContactArgs,
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
					text: `Deleting contacts is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		await callGraphAPI(
			accessToken,
			"DELETE",
			`users/${mailbox}/contacts/${contactId}`,
		);

		return {
			content: [
				{
					type: "text",
					text: "Contact deleted successfully.",
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
					text: `Error deleting contact: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleDeleteContact;
