/**
 * Email module for Outlook MCP server
 */

import {
	archiveDeleteTools,
	handleArchiveEmail,
	handleDeleteEmail,
} from "./archive-delete";
import {
	handleListAttachments,
	handleGetAttachment,
	handleAddAttachment,
} from "./attachments";
import {
	categoriesTools,
	handleGetMasterCategories,
	handleSetEmailCategories,
} from "./categories";
import { handleCopyEmail } from "./copy";
import { handleCreateDraft, handleUpdateDraft, handleSendDraft } from "./drafts";
import { handleFlagEmail } from "./flag";
import { handleForwardEmail } from "./forward";
import { handleListEmails } from "./list";
import { handleMarkAsRead } from "./mark-as-read";
import { handleReadEmail } from "./read";
import { handleReplyEmail, handleReplyAllEmail } from "./reply";
import { handleSearchEmails } from "./search";
import { handleSendEmail } from "./send";

interface MCPResponse {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<
			string,
			{
				type: string;
				description: string;
				enum?: string[];
				items?: { type: string };
			}
		>;
		required: string[];
		additionalProperties?: boolean;
	};
	handler: (args: Record<string, unknown>) => Promise<MCPResponse>;
}

// Email tool definitions
export const emailTools: ToolDefinition[] = [
	{
		name: "list-emails",
		description: "Lists recent emails from your inbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				folder: {
					type: "string",
					description:
						"Email folder to list (e.g., 'inbox', 'sent', 'drafts', default: 'inbox')",
				},
				count: {
					type: "number",
					description: "Number of emails to retrieve (default: 10, max: 50)",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleListEmails as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "search-emails",
		description: "Search for emails using various criteria",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				query: {
					type: "string",
					description: "Search query text to find in emails",
				},
				folder: {
					type: "string",
					description: "Email folder to search in (default: 'inbox')",
				},
				from: {
					type: "string",
					description: "Filter by sender email address or name",
				},
				to: {
					type: "string",
					description: "Filter by recipient email address or name",
				},
				subject: {
					type: "string",
					description: "Filter by email subject",
				},
				hasAttachments: {
					type: "boolean",
					description: "Filter to only emails with attachments",
				},
				unreadOnly: {
					type: "boolean",
					description: "Filter to only unread emails",
				},
				count: {
					type: "number",
					description: "Number of results to return (default: 10, max: 50)",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleSearchEmails as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "read-email",
		description: "Reads the content of a specific email",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to read",
				},
			},
			required: ["mailbox", "id"],
			additionalProperties: false,
		},
		handler: handleReadEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "send-email",
		description: "Composes and sends a new email",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to send from (e.g., 'chi@desertservices.net')",
				},
				to: {
					type: "string",
					description: "Comma-separated list of recipient email addresses",
				},
				cc: {
					type: "string",
					description: "Comma-separated list of CC recipient email addresses",
				},
				bcc: {
					type: "string",
					description: "Comma-separated list of BCC recipient email addresses",
				},
				subject: {
					type: "string",
					description: "Email subject",
				},
				body: {
					type: "string",
					description: "Email body content (can be plain text or HTML)",
				},
				importance: {
					type: "string",
					description: "Email importance (normal, high, low)",
					enum: ["normal", "high", "low"],
				},
				saveToSentItems: {
					type: "boolean",
					description: "Whether to save the email to sent items",
				},
			},
			required: ["mailbox", "to", "subject", "body"],
			additionalProperties: false,
		},
		handler: handleSendEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "reply-email",
		description: "Replies to an email. Optionally override the reply-to recipients.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to send from (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to reply to",
				},
				comment: {
					type: "string",
					description: "Reply body content",
				},
				toRecipients: {
					type: "string",
					description:
						"Comma-separated list of recipient email addresses to override the default reply-to (optional)",
				},
			},
			required: ["mailbox", "id", "comment"],
			additionalProperties: false,
		},
		handler: handleReplyEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "reply-all-email",
		description: "Replies to all recipients of an email.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to send from (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to reply to",
				},
				comment: {
					type: "string",
					description: "Reply body content",
				},
			},
			required: ["mailbox", "id", "comment"],
			additionalProperties: false,
		},
		handler: handleReplyAllEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "forward-email",
		description: "Forwards an email to the specified recipients with an optional comment.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to send from (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to forward",
				},
				toRecipients: {
					type: "string",
					description:
						"Comma-separated list of recipient email addresses to forward to",
				},
				comment: {
					type: "string",
					description: "Optional comment to include with the forwarded email",
				},
			},
			required: ["mailbox", "id", "toRecipients"],
			additionalProperties: false,
		},
		handler: handleForwardEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-draft",
		description: "Creates a new draft email in the Drafts folder.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				subject: {
					type: "string",
					description: "Email subject",
				},
				body: {
					type: "string",
					description: "Email body content (can be plain text or HTML)",
				},
				to: {
					type: "string",
					description: "Comma-separated list of recipient email addresses",
				},
				cc: {
					type: "string",
					description: "Comma-separated list of CC recipient email addresses",
				},
				bcc: {
					type: "string",
					description: "Comma-separated list of BCC recipient email addresses",
				},
				importance: {
					type: "string",
					description: "Email importance (normal, high, low)",
					enum: ["normal", "high", "low"],
				},
			},
			required: ["mailbox", "subject", "body"],
			additionalProperties: false,
		},
		handler: handleCreateDraft as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "update-draft",
		description: "Updates an existing draft email with new field values. Only provided fields are updated.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the draft to update",
				},
				subject: {
					type: "string",
					description: "New email subject",
				},
				body: {
					type: "string",
					description: "New email body content (can be plain text or HTML)",
				},
				to: {
					type: "string",
					description: "Comma-separated list of recipient email addresses",
				},
				cc: {
					type: "string",
					description: "Comma-separated list of CC recipient email addresses",
				},
				bcc: {
					type: "string",
					description: "Comma-separated list of BCC recipient email addresses",
				},
				importance: {
					type: "string",
					description: "Email importance (normal, high, low)",
					enum: ["normal", "high", "low"],
				},
			},
			required: ["mailbox", "id"],
			additionalProperties: false,
		},
		handler: handleUpdateDraft as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "send-draft",
		description: "Sends an existing draft email.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to send from (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the draft to send",
				},
			},
			required: ["mailbox", "id"],
			additionalProperties: false,
		},
		handler: handleSendDraft as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "list-attachments",
		description: "Lists all attachments on a specific email message.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				messageId: {
					type: "string",
					description: "ID of the email message to list attachments for",
				},
			},
			required: ["mailbox", "messageId"],
			additionalProperties: false,
		},
		handler: handleListAttachments as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-attachment",
		description: "Retrieves a specific attachment from an email, including its base64 content.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				messageId: {
					type: "string",
					description: "ID of the email message",
				},
				attachmentId: {
					type: "string",
					description: "ID of the attachment to retrieve",
				},
			},
			required: ["mailbox", "messageId", "attachmentId"],
			additionalProperties: false,
		},
		handler: handleGetAttachment as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "add-attachment",
		description: "Adds a file attachment to an email message (typically a draft).",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				messageId: {
					type: "string",
					description: "ID of the email message to attach to",
				},
				name: {
					type: "string",
					description: "File name of the attachment (e.g., 'document.pdf')",
				},
				contentType: {
					type: "string",
					description: "MIME type of the attachment (e.g., 'application/pdf')",
				},
				contentBytes: {
					type: "string",
					description: "Base64-encoded content of the attachment",
				},
			},
			required: ["mailbox", "messageId", "name", "contentType", "contentBytes"],
			additionalProperties: false,
		},
		handler: handleAddAttachment as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "flag-email",
		description: "Sets the flag status on an email. Can optionally set start and due dates for follow-up.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to flag",
				},
				flagStatus: {
					type: "string",
					description: "Flag status to set on the email",
					enum: ["notFlagged", "flagged", "complete"],
				},
				startDateTime: {
					type: "string",
					description: "Start date/time for the follow-up flag (ISO 8601 format, optional)",
				},
				dueDateTime: {
					type: "string",
					description: "Due date/time for the follow-up flag (ISO 8601 format, optional)",
				},
			},
			required: ["mailbox", "id", "flagStatus"],
			additionalProperties: false,
		},
		handler: handleFlagEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "copy-email",
		description: "Copies an email to a specified folder.",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to copy",
				},
				destinationFolder: {
					type: "string",
					description:
						"Destination folder name (e.g., 'inbox', 'drafts', 'sent', 'archive', or a custom folder name)",
				},
			},
			required: ["mailbox", "id", "destinationFolder"],
			additionalProperties: false,
		},
		handler: handleCopyEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "mark-as-read",
		description: "Marks an email as read or unread",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				id: {
					type: "string",
					description: "ID of the email to mark as read/unread",
				},
				isRead: {
					type: "boolean",
					description:
						"Whether to mark as read (true) or unread (false). Default: true",
				},
			},
			required: ["mailbox", "id"],
			additionalProperties: false,
		},
		handler: handleMarkAsRead as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	// Add categories tools
	...categoriesTools,
	// Add archive and delete tools
	...archiveDeleteTools,
];

export {
	handleListEmails,
	handleSearchEmails,
	handleReadEmail,
	handleSendEmail,
	handleReplyEmail,
	handleReplyAllEmail,
	handleForwardEmail,
	handleCreateDraft,
	handleUpdateDraft,
	handleSendDraft,
	handleListAttachments,
	handleGetAttachment,
	handleAddAttachment,
	handleFlagEmail,
	handleCopyEmail,
	handleMarkAsRead,
	handleGetMasterCategories,
	handleSetEmailCategories,
	handleArchiveEmail,
	handleDeleteEmail,
	categoriesTools,
	archiveDeleteTools,
};
