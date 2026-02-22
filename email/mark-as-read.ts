/**
 * Mark email as read functionality
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
 * Arguments for mark as read handler
 */
interface MarkAsReadArgs {
	id?: string;
	isRead?: boolean;
	mailbox?: string;
}

/**
 * Mark email as read handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleMarkAsRead(
	args: MarkAsReadArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const isRead = args.isRead !== undefined ? args.isRead : true; // Default to true

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Email ID is required.",
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
					text: `Modifying emails is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Make API call to update email read status
		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}`;
		const updateData = {
			isRead: isRead,
		};

		try {
			await callGraphAPI(accessToken, "PATCH", endpoint, updateData);

			const status = isRead ? "read" : "unread";

			return {
				content: [
					{
						type: "text",
						text: `Email successfully marked as ${status}.`,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error marking email as ${isRead ? "read" : "unread"}: ${errorMessage}`,
			);

			// Improved error handling with more specific messages
			if (errorMessage.includes("doesn't belong to the targeted mailbox")) {
				return {
					content: [
						{
							type: "text",
							text: "The email ID seems invalid or doesn't belong to your mailbox. Please try with a different email ID.",
						},
					],
					isError: true,
				};
			}
			if (errorMessage.includes("UNAUTHORIZED")) {
				return {
					content: [
						{
							type: "text",
							text: "Authentication failed. Please re-authenticate and try again.",
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to mark email as ${isRead ? "read" : "unread"}: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
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
					text: `Error accessing email: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleMarkAsRead;
