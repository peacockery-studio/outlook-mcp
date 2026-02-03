/**
 * Email rules management module for Outlook MCP server
 */

import { ensureAuthenticated } from "../auth/index.js";
import type { MCPResponse, ToolDefinition } from "../auth/tools.js";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
	getCurrentUserEmail,
} from "../config/mailbox-permissions.js";
import { callGraphAPI } from "../utils/graph-api.js";
import handleCreateRule from "./create.js";
import { getInboxRules, handleListRules } from "./list.js";

export interface EditRuleSequenceArgs {
	ruleName: string;
	sequence: number;
}

/**
 * Edit rule sequence handler
 */
export async function handleEditRuleSequence(
	args: EditRuleSequenceArgs,
): Promise<MCPResponse> {
	const { ruleName, sequence } = args;

	if (!ruleName) {
		return {
			content: [
				{
					type: "text",
					text: "Rule name is required. Please specify the exact name of an existing rule.",
				},
			],
		};
	}

	if (!sequence || Number.isNaN(sequence) || sequence < 1) {
		return {
			content: [
				{
					type: "text",
					text: "A positive sequence number is required. Lower numbers run first (higher priority).",
				},
			],
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Check if the current mailbox has permission to modify
		const currentUserEmail = await getCurrentUserEmail(accessToken);
		if (!canModifyMailbox(currentUserEmail)) {
			return {
				content: [
					{
						type: "text",
						text: `Editing rules is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		const rules = await getInboxRules(accessToken);

		const rule = rules.find((r) => r.displayName === ruleName);
		if (!rule) {
			return {
				content: [
					{
						type: "text",
						text: `Rule with name "${ruleName}" not found.`,
					},
				],
			};
		}

		await callGraphAPI(
			accessToken,
			"PATCH",
			`me/mailFolders/inbox/messageRules/${rule.id}`,
			{
				sequence: sequence,
			},
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully updated the sequence of rule "${ruleName}" to ${sequence}.`,
				},
			],
		};
	} catch (error) {
		if ((error as Error).message === "Authentication required") {
			return {
				content: [
					{
						type: "text",
						text: "Authentication required. Please use the 'authenticate' tool first.",
					},
				],
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error updating rule sequence: ${(error as Error).message}`,
				},
			],
		};
	}
}

export const rulesTools: ToolDefinition[] = [
	{
		name: "list-rules",
		description: "Lists inbox rules in your Outlook account",
		inputSchema: {
			type: "object",
			properties: {
				includeDetails: {
					type: "boolean",
					description: "Include detailed rule conditions and actions",
				},
			},
			required: [],
		},
		handler: handleListRules as unknown as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-rule",
		description: "Creates a new inbox rule",
		inputSchema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Name of the rule to create",
				},
				fromAddresses: {
					type: "string",
					description:
						"Comma-separated list of sender email addresses for the rule",
				},
				containsSubject: {
					type: "string",
					description: "Subject text the email must contain",
				},
				hasAttachments: {
					type: "boolean",
					description: "Whether the rule applies to emails with attachments",
				},
				moveToFolder: {
					type: "string",
					description: "Name of the folder to move matching emails to",
				},
				markAsRead: {
					type: "boolean",
					description: "Whether to mark matching emails as read",
				},
				isEnabled: {
					type: "boolean",
					description:
						"Whether the rule should be enabled after creation (default: true)",
				},
				sequence: {
					type: "number",
					description:
						"Order in which the rule is executed (lower numbers run first, default: 100)",
				},
			},
			required: ["name"],
		},
		handler: handleCreateRule as unknown as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "edit-rule-sequence",
		description: "Changes the execution order of an existing inbox rule",
		inputSchema: {
			type: "object",
			properties: {
				ruleName: {
					type: "string",
					description: "Name of the rule to modify",
				},
				sequence: {
					type: "number",
					description:
						"New sequence value for the rule (lower numbers run first)",
				},
			},
			required: ["ruleName", "sequence"],
		},
		handler: handleEditRuleSequence as unknown as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export { handleListRules, handleCreateRule };
