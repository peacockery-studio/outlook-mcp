/**
 * Draft email functionality
 *
 * Provides tools for creating, updating, and sending draft emails
 * via Microsoft Graph API.
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
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
 * Arguments for create draft handler
 */
interface CreateDraftArgs {
	mailbox?: string;
	subject?: string;
	body?: string;
	to?: string;
	cc?: string;
	bcc?: string;
	importance?: "normal" | "high" | "low";
}

/**
 * Arguments for update draft handler
 */
interface UpdateDraftArgs {
	mailbox?: string;
	id?: string;
	subject?: string;
	body?: string;
	to?: string;
	cc?: string;
	bcc?: string;
	importance?: "normal" | "high" | "low";
}

/**
 * Arguments for send draft handler
 */
interface SendDraftArgs {
	mailbox?: string;
	id?: string;
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
 * Draft message response from Graph API
 */
interface DraftMessageResponse {
	id?: string;
	subject?: string;
}

/**
 * Parse a comma-separated string of email addresses into Graph API recipients
 */
function parseRecipients(recipientStr: string): GraphRecipient[] {
	return recipientStr.split(",").map((email) => ({
		emailAddress: {
			address: email.trim(),
		},
	}));
}

/**
 * Create draft email handler
 *
 * Creates a new draft email in the mailbox's Drafts folder.
 *
 * @param args - Tool arguments
 * @returns MCP response with the created draft ID
 */
export async function handleCreateDraft(
	args: CreateDraftArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { subject, body, to, cc, bcc, importance = "normal" } = args;

	if (!subject) {
		return {
			content: [
				{
					type: "text",
					text: "Subject is required.",
				},
			],
			isError: true,
		};
	}

	if (!body) {
		return {
			content: [
				{
					type: "text",
					text: "Body content is required.",
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
		const accessToken = await ensureAuthenticated();

		// Build draft message object
		const draftMessage: Record<string, unknown> = {
			subject,
			body: {
				contentType: body.includes("<html") ? "html" : "text",
				content: body,
			},
			importance,
		};

		if (to) {
			draftMessage.toRecipients = parseRecipients(to);
		}
		if (cc) {
			draftMessage.ccRecipients = parseRecipients(cc);
		}
		if (bcc) {
			draftMessage.bccRecipients = parseRecipients(bcc);
		}

		const endpoint = `users/${mailbox}/messages`;

		try {
			const response = (await callGraphAPI(
				accessToken,
				"POST",
				endpoint,
				draftMessage,
			)) as DraftMessageResponse;

			return {
				content: [
					{
						type: "text",
						text: `Draft created successfully.\n\nDraft ID: ${response.id ?? "unknown"}\nSubject: ${subject}`,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

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
						text: `Failed to create draft: ${errorMessage}`,
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
					text: `Error creating draft: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Update draft email handler
 *
 * Updates an existing draft email with new field values.
 * Only sends fields that are provided.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleUpdateDraft(
	args: UpdateDraftArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Draft ID is required.",
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
		const accessToken = await ensureAuthenticated();

		// Build update object with only provided fields
		const updateData: Record<string, unknown> = {};

		if (args.subject !== undefined) {
			updateData.subject = args.subject;
		}
		if (args.body !== undefined) {
			updateData.body = {
				contentType: args.body.includes("<html") ? "html" : "text",
				content: args.body,
			};
		}
		if (args.to !== undefined) {
			updateData.toRecipients = parseRecipients(args.to);
		}
		if (args.cc !== undefined) {
			updateData.ccRecipients = parseRecipients(args.cc);
		}
		if (args.bcc !== undefined) {
			updateData.bccRecipients = parseRecipients(args.bcc);
		}
		if (args.importance !== undefined) {
			updateData.importance = args.importance;
		}

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}`;

		try {
			await callGraphAPI(accessToken, "PATCH", endpoint, updateData);

			const updatedFields = Object.keys(updateData).join(", ");

			return {
				content: [
					{
						type: "text",
						text: `Draft updated successfully.\n\nUpdated fields: ${updatedFields}`,
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
							text: "The draft ID seems invalid or doesn't belong to your mailbox. Please try with a different ID.",
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
						text: `Failed to update draft: ${errorMessage}`,
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
					text: `Error accessing draft: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Send draft email handler
 *
 * Sends an existing draft email. The draft must already exist in the mailbox.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleSendDraft(
	args: SendDraftArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Draft ID is required.",
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

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}/send`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint);

			return {
				content: [
					{
						type: "text",
						text: "Draft sent successfully.",
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
							text: "The draft ID seems invalid or doesn't belong to your mailbox. Please try with a different ID.",
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
						text: `Failed to send draft: ${errorMessage}`,
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
					text: `Error accessing draft: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default { handleCreateDraft, handleUpdateDraft, handleSendDraft };
