/**
 * Email attachments functionality
 *
 * Provides tools for listing, getting, and adding attachments to emails
 * via Microsoft Graph API.
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
 * Arguments for list attachments handler
 */
interface ListAttachmentsArgs {
	mailbox?: string;
	messageId?: string;
}

/**
 * Arguments for get attachment handler
 */
interface GetAttachmentArgs {
	mailbox?: string;
	messageId?: string;
	attachmentId?: string;
}

/**
 * Arguments for add attachment handler
 */
interface AddAttachmentArgs {
	mailbox?: string;
	messageId?: string;
	name?: string;
	contentType?: string;
	contentBytes?: string;
}

/**
 * Attachment item from Graph API
 */
interface GraphAttachment {
	id?: string;
	name?: string;
	contentType?: string;
	size?: number;
	contentBytes?: string;
}

/**
 * Graph API response for attachments list
 */
interface AttachmentsListResponse {
	value?: GraphAttachment[];
}

/**
 * List attachments handler
 *
 * Lists all attachments on a specific email message.
 *
 * @param args - Tool arguments
 * @returns MCP response with attachment list
 */
export async function handleListAttachments(
	args: ListAttachmentsArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const messageId = args.messageId;

	if (!messageId) {
		return {
			content: [
				{
					type: "text",
					text: "Message ID is required.",
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// graph-api.ts handles path segment encoding — do NOT pre-encode messageId
		const endpoint = `users/${mailbox}/messages/${messageId}/attachments`;

		try {
			const response = (await callGraphAPI(
				accessToken,
				"GET",
				endpoint,
				null,
			)) as AttachmentsListResponse;

			if (!response.value || response.value.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "No attachments found on this email.",
						},
					],
				};
			}

			const attachmentList = response.value
				.map((att, index) => {
					const sizeKB = att.size ? (att.size / 1024).toFixed(1) : "unknown";
					return `${index + 1}. ${att.name ?? "Unnamed"}\n   Type: ${att.contentType ?? "unknown"}\n   Size: ${sizeKB} KB\n   ID: ${att.id ?? "unknown"}`;
				})
				.join("\n\n");

			return {
				content: [
					{
						type: "text",
						text: `Found ${response.value.length} attachment(s):\n\n${attachmentList}`,
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
							text: "The message ID seems invalid or doesn't belong to your mailbox. Please try with a different message ID.",
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
						text: `Failed to list attachments: ${errorMessage}`,
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
 * Get attachment handler
 *
 * Retrieves a specific attachment from an email, including its content.
 *
 * @param args - Tool arguments
 * @returns MCP response with attachment details and content
 */
export async function handleGetAttachment(
	args: GetAttachmentArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const messageId = args.messageId;
	const attachmentId = args.attachmentId;

	if (!messageId) {
		return {
			content: [
				{
					type: "text",
					text: "Message ID is required.",
				},
			],
			isError: true,
		};
	}

	if (!attachmentId) {
		return {
			content: [
				{
					type: "text",
					text: "Attachment ID is required.",
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// graph-api.ts handles path segment encoding — do NOT pre-encode IDs
		const endpoint = `users/${mailbox}/messages/${messageId}/attachments/${attachmentId}`;

		try {
			const response = (await callGraphAPI(
				accessToken,
				"GET",
				endpoint,
				null,
			)) as GraphAttachment;

			const sizeKB = response.size
				? (response.size / 1024).toFixed(1)
				: "unknown";

			return {
				content: [
					{
						type: "text",
						text: `Attachment details:\n\nName: ${response.name ?? "Unnamed"}\nType: ${response.contentType ?? "unknown"}\nSize: ${sizeKB} KB\nContent (base64): ${response.contentBytes ?? "N/A"}`,
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
							text: "The message or attachment ID seems invalid. Please try with different IDs.",
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
						text: `Failed to get attachment: ${errorMessage}`,
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
					text: `Error accessing attachment: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Add attachment handler
 *
 * Adds a file attachment to an email message (typically a draft).
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleAddAttachment(
	args: AddAttachmentArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const messageId = args.messageId;
	const name = args.name;
	const contentType = args.contentType;
	const contentBytes = args.contentBytes;

	if (!messageId) {
		return {
			content: [
				{
					type: "text",
					text: "Message ID is required.",
				},
			],
			isError: true,
		};
	}

	if (!name) {
		return {
			content: [
				{
					type: "text",
					text: "Attachment name is required.",
				},
			],
			isError: true,
		};
	}

	if (!contentType) {
		return {
			content: [
				{
					type: "text",
					text: "Content type is required.",
				},
			],
			isError: true,
		};
	}

	if (!contentBytes) {
		return {
			content: [
				{
					type: "text",
					text: "Content bytes (base64) are required.",
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

		const attachmentData = {
			"@odata.type": "#microsoft.graph.fileAttachment",
			name,
			contentType,
			contentBytes,
		};

		// graph-api.ts handles path segment encoding — do NOT pre-encode messageId
		const endpoint = `users/${mailbox}/messages/${messageId}/attachments`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint, attachmentData);

			return {
				content: [
					{
						type: "text",
						text: `Attachment "${name}" added successfully.`,
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
							text: "The message ID seems invalid or doesn't belong to your mailbox. Please try with a different message ID.",
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
						text: `Failed to add attachment: ${errorMessage}`,
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

export default { handleListAttachments, handleGetAttachment, handleAddAttachment };
