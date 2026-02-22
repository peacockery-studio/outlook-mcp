/**
 * Reply and reply-all email functionality
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
 * Arguments for reply email handler
 */
interface ReplyEmailArgs {
	mailbox?: string;
	id?: string;
	comment?: string;
	toRecipients?: string;
}

/**
 * Arguments for reply-all email handler
 */
interface ReplyAllEmailArgs {
	mailbox?: string;
	id?: string;
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
 * Reply email handler
 *
 * Replies to an email. Optionally override the reply-to recipients.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleReplyEmail(
	args: ReplyEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const comment = args.comment;

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

	if (!comment) {
		return {
			content: [
				{
					type: "text",
					text: "Comment (reply body) is required.",
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

		// Build request body
		const requestBody: { comment: string; message?: { toRecipients: GraphRecipient[] } } = {
			comment,
		};

		// Optionally override reply-to recipients
		if (args.toRecipients) {
			const toRecipients: GraphRecipient[] = args.toRecipients
				.split(",")
				.map((email) => ({
					emailAddress: {
						address: email.trim(),
					},
				}));
			requestBody.message = { toRecipients };
		}

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}/reply`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint, requestBody);

			return {
				content: [
					{
						type: "text",
						text: "Reply sent successfully.",
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
						text: `Failed to reply to email: ${errorMessage}`,
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

/**
 * Reply-all email handler
 *
 * Replies to all recipients of an email.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleReplyAllEmail(
	args: ReplyAllEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const comment = args.comment;

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

	if (!comment) {
		return {
			content: [
				{
					type: "text",
					text: "Comment (reply body) is required.",
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

		const requestBody = {
			comment,
		};

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}/replyAll`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint, requestBody);

			return {
				content: [
					{
						type: "text",
						text: "Reply-all sent successfully.",
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
						text: `Failed to reply-all to email: ${errorMessage}`,
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

export default { handleReplyEmail, handleReplyAllEmail };
