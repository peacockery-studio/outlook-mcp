/**
 * Out-of-office / automatic replies settings functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_TIMEZONE } from "../config";
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
 * Arguments for update out-of-office handler
 */
interface UpdateOutOfOfficeArgs {
	mailbox?: string;
	status?: string;
	internalReplyMessage?: string;
	externalReplyMessage?: string;
	externalAudience?: string;
	scheduledStartDateTime?: string;
	scheduledEndDateTime?: string;
}

/**
 * Automatic replies setting body for Graph API
 */
interface AutomaticRepliesSettingBody {
	status: string;
	internalReplyMessage?: string;
	externalReplyMessage?: string;
	externalAudience?: string;
	scheduledStartDateTime?: { dateTime: string; timeZone: string };
	scheduledEndDateTime?: { dateTime: string; timeZone: string };
}

/**
 * Mailbox settings patch body for Graph API
 */
interface MailboxSettingsPatchBody {
	automaticRepliesSetting: AutomaticRepliesSettingBody;
}

/**
 * Update out-of-office handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleUpdateOutOfOffice(
	args: UpdateOutOfOfficeArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const status = args.status;
	if (!status) {
		return {
			content: [
				{
					type: "text",
					text: "Status is required (disabled, alwaysEnabled, or scheduled).",
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
					text: `Updating out-of-office settings is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const automaticRepliesSetting: AutomaticRepliesSettingBody = {
			status,
		};

		if (args.internalReplyMessage) {
			automaticRepliesSetting.internalReplyMessage =
				args.internalReplyMessage;
		}
		if (args.externalReplyMessage) {
			automaticRepliesSetting.externalReplyMessage =
				args.externalReplyMessage;
		}
		if (args.externalAudience) {
			automaticRepliesSetting.externalAudience = args.externalAudience;
		}
		if (args.scheduledStartDateTime) {
			automaticRepliesSetting.scheduledStartDateTime = {
				dateTime: args.scheduledStartDateTime,
				timeZone: DEFAULT_TIMEZONE,
			};
		}
		if (args.scheduledEndDateTime) {
			automaticRepliesSetting.scheduledEndDateTime = {
				dateTime: args.scheduledEndDateTime,
				timeZone: DEFAULT_TIMEZONE,
			};
		}

		const body: MailboxSettingsPatchBody = { automaticRepliesSetting };

		await callGraphAPI(
			accessToken,
			"PATCH",
			`users/${mailbox}/mailboxSettings`,
			body,
		);

		const statusLabel =
			status === "disabled"
				? "Disabled"
				: status === "alwaysEnabled"
					? "Always Enabled"
					: "Scheduled";

		return {
			content: [
				{
					type: "text",
					text: `Out-of-office settings updated successfully!\n\nStatus: ${statusLabel}${
						args.scheduledStartDateTime
							? `\nScheduled Start: ${args.scheduledStartDateTime}`
							: ""
					}${
						args.scheduledEndDateTime
							? `\nScheduled End: ${args.scheduledEndDateTime}`
							: ""
					}`,
				},
			],
		};
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
					text: `Error updating out-of-office settings: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleUpdateOutOfOffice;
