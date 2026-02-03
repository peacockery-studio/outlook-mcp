/**
 * Create rule functionality
 */

import { ensureAuthenticated } from "../auth/index.js";
import type { MCPResponse } from "../auth/tools.js";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
	getCurrentUserEmail,
} from "../config/mailbox-permissions.js";
import { getFolderIdByName } from "../email/folder-utils.js";
import { callGraphAPI } from "../utils/graph-api.js";
import { getInboxRules } from "./list.js";

export interface CreateRuleArgs {
	name: string;
	fromAddresses?: string;
	containsSubject?: string;
	hasAttachments?: boolean;
	moveToFolder?: string;
	markAsRead?: boolean;
	isEnabled?: boolean;
	sequence?: number;
}

export interface CreateRuleResult {
	success: boolean;
	message: string;
	ruleId?: string;
	error?: boolean;
}

/**
 * Create rule handler
 */
export async function handleCreateRule(
	args: CreateRuleArgs,
): Promise<MCPResponse> {
	const {
		name,
		fromAddresses,
		containsSubject,
		hasAttachments,
		moveToFolder,
		markAsRead,
		isEnabled = true,
		sequence,
	} = args;

	if (sequence !== undefined && (Number.isNaN(sequence) || sequence < 1)) {
		return {
			content: [
				{
					type: "text",
					text: "Sequence must be a positive number greater than zero.",
				},
			],
		};
	}

	if (!name) {
		return {
			content: [
				{
					type: "text",
					text: "Rule name is required.",
				},
			],
		};
	}

	const hasCondition =
		fromAddresses || containsSubject || hasAttachments === true;
	const hasAction = moveToFolder || markAsRead === true;

	if (!hasCondition) {
		return {
			content: [
				{
					type: "text",
					text: "At least one condition is required. Specify fromAddresses, containsSubject, or hasAttachments.",
				},
			],
		};
	}

	if (!hasAction) {
		return {
			content: [
				{
					type: "text",
					text: "At least one action is required. Specify moveToFolder or markAsRead.",
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
						text: `Creating rules is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		const result = await createInboxRule(accessToken, {
			name,
			fromAddresses,
			containsSubject,
			hasAttachments,
			moveToFolder,
			markAsRead,
			isEnabled,
			sequence,
		});

		let responseText = result.message;

		if (!sequence && !result.error) {
			responseText +=
				"\n\nTip: You can specify a 'sequence' parameter when creating rules to control their execution order. Lower sequence numbers run first.";
		}

		return {
			content: [
				{
					type: "text",
					text: responseText,
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
					text: `Error creating rule: ${(error as Error).message}`,
				},
			],
		};
	}
}

/**
 * Create a new inbox rule
 */
async function createInboxRule(
	accessToken: string,
	ruleOptions: CreateRuleArgs,
): Promise<CreateRuleResult> {
	try {
		const {
			name,
			fromAddresses,
			containsSubject,
			hasAttachments,
			moveToFolder,
			markAsRead,
			isEnabled,
			sequence,
		} = ruleOptions;

		let ruleSequence = sequence;
		if (!ruleSequence) {
			try {
				ruleSequence = 100;

				const existingRules = await getInboxRules(accessToken);
				if (existingRules?.length > 0) {
					const highestSequence = Math.max(
						...existingRules.map((r) => r.sequence || 0),
					);
					ruleSequence = Math.max(highestSequence + 1, 100);
					console.error(
						`Auto-generated sequence: ${ruleSequence} (based on highest existing: ${highestSequence})`,
					);
				}
			} catch (sequenceError) {
				console.error(
					`Error determining rule sequence: ${(sequenceError as Error).message}`,
				);
				ruleSequence = 100;
			}
		}

		console.error(`Using rule sequence: ${ruleSequence}`);
		ruleSequence = Math.max(1, Math.floor(ruleSequence));

		const rule: {
			displayName: string;
			isEnabled: boolean;
			sequence: number;
			conditions: Record<string, unknown>;
			actions: Record<string, unknown>;
		} = {
			displayName: name,
			isEnabled: isEnabled === true,
			sequence: ruleSequence,
			conditions: {},
			actions: {},
		};

		if (fromAddresses) {
			const emailAddresses = fromAddresses
				.split(",")
				.map((email) => email.trim())
				.filter((email) => email)
				.map((email) => ({
					emailAddress: {
						address: email,
					},
				}));

			if (emailAddresses.length > 0) {
				rule.conditions.fromAddresses = emailAddresses;
			}
		}

		if (containsSubject) {
			rule.conditions.subjectContains = [containsSubject];
		}

		if (hasAttachments === true) {
			rule.conditions.hasAttachment = true;
		}

		if (moveToFolder) {
			try {
				const folderId = await getFolderIdByName(accessToken, moveToFolder);
				if (!folderId) {
					return {
						success: false,
						message: `Target folder "${moveToFolder}" not found. Please specify a valid folder name.`,
					};
				}

				rule.actions.moveToFolder = folderId;
			} catch (folderError) {
				console.error(
					`Error resolving folder "${moveToFolder}": ${(folderError as Error).message}`,
				);
				return {
					success: false,
					message: `Error resolving folder "${moveToFolder}": ${(folderError as Error).message}`,
				};
			}
		}

		if (markAsRead === true) {
			rule.actions.markAsRead = true;
		}

		const response = await callGraphAPI<{ id: string; displayName: string }>(
			accessToken,
			"POST",
			"me/mailFolders/inbox/messageRules",
			rule,
		);

		if (response?.id) {
			return {
				success: true,
				message: `Successfully created rule "${name}" with sequence ${ruleSequence}.`,
				ruleId: response.id,
			};
		}
		return {
			success: false,
			message: "Failed to create rule. The server didn't return a rule ID.",
		};
	} catch (error) {
		console.error(`Error creating rule: ${(error as Error).message}`);
		throw error;
	}
}

export default handleCreateRule;
