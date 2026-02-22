/**
 * Forward email functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canSendFrom,
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
 * Arguments for forward email handler
 */
interface ForwardEmailArgs {
	mailbox?: string;
	id?: string;
	toRecipients?: string;
	comment?: string;
}

/**
 * Email recipient structure for Graph API
 */
interface GraphRecipient {
	emailAddress: {
		address: string;
	};
}

/**
 * Forward email handler
 *
 * Forwards an email to the specified recipients with an optional comment.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleForwardEmail(
	args: ForwardEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const toRecipientsStr = args.toRecipients;
	const comment = args.comment ?? "";

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

	if (!toRecipientsStr) {
		return {
			content: [
				{
					type: "text",
					text: "Recipients (toRecipients) are required for forwarding.",
				},
			],
			isError: true,
		};
	}

	// Check if the mailbox has permission to send
	if (!canSendFrom(mailbox)) {
		return {
			content: [
				{
					type: "text",
					text: `Sending is not allowed from ${mailbox}. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Parse comma-separated recipients
		const toRecipients: GraphRecipient[] = toRecipientsStr
			.split(",")
			.map((email) => ({
				emailAddress: {
					address: email.trim(),
				},
			}));

		const requestBody = {
			comment,
			toRecipients,
		};

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}/forward`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint, requestBody);

			const recipientList = toRecipients
				.map((r) => r.emailAddress.address)
				.join(", ");

			return {
				content: [
					{
						type: "text",
						text: `Email forwarded successfully to: ${recipientList}`,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

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
						text: `Failed to forward email: ${errorMessage}`,
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

export default handleForwardEmail;
