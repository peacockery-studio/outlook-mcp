/**
 * Rule delete and update functionality
 */

import { ensureAuthenticated } from "../auth/index";
import type { MCPResponse } from "../auth/tools";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { getFolderIdByName } from "../email/folder-utils";
import { callGraphAPI } from "../utils/graph-api";
import { getInboxRules } from "./list";

export interface DeleteRuleArgs {
	mailbox?: string;
	ruleName?: string;
}

export interface UpdateRuleArgs {
	mailbox?: string;
	ruleName?: string;
	displayName?: string;
	isEnabled?: boolean;
	sequence?: number;
	// Conditions
	fromAddresses?: string;
	subjectContains?: string;
	bodyContains?: string;
	hasAttachments?: boolean;
	headerContains?: string;
	sentOnlyToMe?: boolean;
	sentCcMe?: boolean;
	isMeetingRequest?: boolean;
	// Actions
	moveToFolder?: string;
	copyToFolder?: string;
	markAsRead?: boolean;
	markImportance?: string;
	forwardTo?: string;
	redirectTo?: string;
	delete?: boolean;
	stopProcessingRules?: boolean;
}

/**
 * Delete rule handler
 */
export async function handleDeleteRule(
	args: DeleteRuleArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const ruleName = args.ruleName;
	if (!ruleName) {
		return {
			content: [
				{
					type: "text",
					text: "Rule name is required. Please specify the exact name of an existing rule.",
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
					text: `Deleting rules is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const rules = await getInboxRules(accessToken, mailbox);

		const rule = rules.find((r) => r.displayName === ruleName);
		if (!rule) {
			return {
				content: [
					{
						type: "text",
						text: `Rule with name "${ruleName}" not found.`,
					},
				],
				isError: true,
			};
		}

		await callGraphAPI(
			accessToken,
			"DELETE",
			`users/${mailbox}/mailFolders/inbox/messageRules/${rule.id}`,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully deleted rule "${ruleName}".`,
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
				isError: true,
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error deleting rule: ${(error as Error).message}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Update rule handler
 */
export async function handleUpdateRule(
	args: UpdateRuleArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const ruleName = args.ruleName;
	if (!ruleName) {
		return {
			content: [
				{
					type: "text",
					text: "Rule name is required. Please specify the exact name of an existing rule.",
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
					text: `Updating rules is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const rules = await getInboxRules(accessToken, mailbox);

		const rule = rules.find((r) => r.displayName === ruleName);
		if (!rule) {
			return {
				content: [
					{
						type: "text",
						text: `Rule with name "${ruleName}" not found.`,
					},
				],
				isError: true,
			};
		}

		// Build PATCH body with only provided fields
		const patchBody: Record<string, unknown> = {};

		if (args.displayName !== undefined) {
			patchBody.displayName = args.displayName;
		}

		if (args.isEnabled !== undefined) {
			patchBody.isEnabled = args.isEnabled;
		}

		if (args.sequence !== undefined) {
			patchBody.sequence = args.sequence;
		}

		// Build conditions object with only provided fields
		const conditions: Record<string, unknown> = {};

		if (args.fromAddresses !== undefined) {
			const emailAddresses = args.fromAddresses
				.split(",")
				.map((email) => email.trim())
				.filter((email) => email)
				.map((email) => ({
					emailAddress: {
						address: email,
					},
				}));

			if (emailAddresses.length > 0) {
				conditions.fromAddresses = emailAddresses;
			}
		}

		if (args.subjectContains !== undefined) {
			conditions.subjectContains = [args.subjectContains];
		}

		if (args.bodyContains !== undefined) {
			conditions.bodyContains = [args.bodyContains];
		}

		if (args.hasAttachments !== undefined) {
			conditions.hasAttachment = args.hasAttachments;
		}

		if (args.headerContains !== undefined) {
			conditions.headerContains = [args.headerContains];
		}

		if (args.sentOnlyToMe !== undefined) {
			conditions.sentOnlyToMe = args.sentOnlyToMe;
		}

		if (args.sentCcMe !== undefined) {
			conditions.sentCcMe = args.sentCcMe;
		}

		if (args.isMeetingRequest !== undefined) {
			conditions.isAutomaticReply = args.isMeetingRequest;
		}

		if (Object.keys(conditions).length > 0) {
			patchBody.conditions = conditions;
		}

		// Build actions object with only provided fields
		const actions: Record<string, unknown> = {};

		if (args.moveToFolder !== undefined) {
			const folderId = await getFolderIdByName(
				accessToken,
				args.moveToFolder,
				mailbox,
			);
			if (!folderId) {
				return {
					content: [
						{
							type: "text",
							text: `Target folder "${args.moveToFolder}" not found. Please specify a valid folder name.`,
						},
					],
					isError: true,
				};
			}
			actions.moveToFolder = folderId;
		}

		if (args.copyToFolder !== undefined) {
			const folderId = await getFolderIdByName(
				accessToken,
				args.copyToFolder,
				mailbox,
			);
			if (!folderId) {
				return {
					content: [
						{
							type: "text",
							text: `Target folder "${args.copyToFolder}" not found. Please specify a valid folder name.`,
						},
					],
					isError: true,
				};
			}
			actions.copyToFolder = folderId;
		}

		if (args.markAsRead !== undefined) {
			actions.markAsRead = args.markAsRead;
		}

		if (args.markImportance !== undefined) {
			actions.markImportance = args.markImportance;
		}

		if (args.forwardTo !== undefined) {
			const recipients = args.forwardTo
				.split(",")
				.map((email) => email.trim())
				.filter((email) => email)
				.map((email) => ({
					emailAddress: {
						address: email,
					},
				}));

			if (recipients.length > 0) {
				actions.forwardTo = recipients;
			}
		}

		if (args.redirectTo !== undefined) {
			const recipients = args.redirectTo
				.split(",")
				.map((email) => email.trim())
				.filter((email) => email)
				.map((email) => ({
					emailAddress: {
						address: email,
					},
				}));

			if (recipients.length > 0) {
				actions.redirectTo = recipients;
			}
		}

		if (args.delete !== undefined) {
			actions.delete = args.delete;
		}

		if (args.stopProcessingRules !== undefined) {
			actions.stopProcessingRules = args.stopProcessingRules;
		}

		if (Object.keys(actions).length > 0) {
			patchBody.actions = actions;
		}

		if (Object.keys(patchBody).length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No updates provided. Please specify at least one field to update.",
					},
				],
				isError: true,
			};
		}

		await callGraphAPI(
			accessToken,
			"PATCH",
			`users/${mailbox}/mailFolders/inbox/messageRules/${rule.id}`,
			patchBody,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully updated rule "${ruleName}".`,
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
				isError: true,
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error updating rule: ${(error as Error).message}`,
				},
			],
			isError: true,
		};
	}
}
