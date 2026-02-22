/**
 * Settings module for Outlook MCP server
 */

import { handleGetMailboxSettings } from "./get";
import { handleGetMailTips } from "./mail-tips";
import { handleUpdateOutOfOffice } from "./out-of-office";

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

// Settings tool definitions
export const settingsTools: ToolDefinition[] = [
	{
		name: "get-mailbox-settings",
		description:
			"Gets mailbox settings including timezone, language, working hours, and auto-reply status",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleGetMailboxSettings as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "update-out-of-office",
		description:
			"Updates out-of-office / automatic replies settings for a mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				status: {
					type: "string",
					description:
						"Auto-reply status: disabled, alwaysEnabled, or scheduled",
					enum: ["disabled", "alwaysEnabled", "scheduled"],
				},
				internalReplyMessage: {
					type: "string",
					description:
						"Reply message for internal senders (can be HTML or plain text)",
				},
				externalReplyMessage: {
					type: "string",
					description:
						"Reply message for external senders (can be HTML or plain text)",
				},
				externalAudience: {
					type: "string",
					description:
						"Who should receive external auto-replies",
					enum: ["none", "contactsOnly", "all"],
				},
				scheduledStartDateTime: {
					type: "string",
					description:
						"Start date/time for scheduled auto-replies in ISO 8601 format",
				},
				scheduledEndDateTime: {
					type: "string",
					description:
						"End date/time for scheduled auto-replies in ISO 8601 format",
				},
			},
			required: ["mailbox", "status"],
			additionalProperties: false,
		},
		handler: handleUpdateOutOfOffice as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-mail-tips",
		description:
			"Gets mail tips for one or more email addresses, including out-of-office status, mailbox full, delivery restrictions, and more",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				emailAddresses: {
					type: "string",
					description:
						"Comma-separated list of email addresses to get mail tips for",
				},
			},
			required: ["mailbox", "emailAddresses"],
			additionalProperties: false,
		},
		handler: handleGetMailTips as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export {
	handleGetMailboxSettings,
	handleUpdateOutOfOffice,
	handleGetMailTips,
};
