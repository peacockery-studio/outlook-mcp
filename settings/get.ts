/**
 * Get mailbox settings functionality
 */

import { ensureAuthenticated } from "../auth";
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
 * Arguments for get mailbox settings handler
 */
interface GetMailboxSettingsArgs {
	mailbox?: string;
}

/**
 * Automatic replies setting from Graph API
 */
interface AutomaticRepliesSetting {
	status?: string;
	internalReplyMessage?: string;
	externalReplyMessage?: string;
	externalAudience?: string;
	scheduledStartDateTime?: { dateTime: string; timeZone: string };
	scheduledEndDateTime?: { dateTime: string; timeZone: string };
}

/**
 * Working hours from Graph API
 */
interface WorkingHours {
	daysOfWeek?: string[];
	startTime?: string;
	endTime?: string;
	timeZone?: { name: string };
}

/**
 * Delegate meeting message delivery options
 */
interface DelegateMeetingMessageDeliveryOptions {
	value?: string;
}

/**
 * Language setting from Graph API
 */
interface LanguageSetting {
	locale?: string;
	displayName?: string;
}

/**
 * Mailbox settings structure from Graph API
 */
interface GraphMailboxSettings {
	automaticRepliesSetting?: AutomaticRepliesSetting;
	language?: LanguageSetting;
	timeZone?: string;
	workingHours?: WorkingHours;
	delegateMeetingMessageDeliveryOptions?: string;
	dateFormat?: string;
	timeFormat?: string;
	userPurpose?: string;
}

/**
 * Get mailbox settings handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleGetMailboxSettings(
	args: GetMailboxSettingsArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const settings = await callGraphAPI<GraphMailboxSettings>(
			accessToken,
			"GET",
			`users/${mailbox}/mailboxSettings`,
		);

		const autoReplies = settings.automaticRepliesSetting;
		const workingHrs = settings.workingHours;
		const lang = settings.language;

		const details = [
			`Timezone: ${settings.timeZone ?? "Not set"}`,
			lang
				? `Language: ${lang.displayName ?? lang.locale ?? "Not set"}`
				: null,
			settings.dateFormat ? `Date Format: ${settings.dateFormat}` : null,
			settings.timeFormat ? `Time Format: ${settings.timeFormat}` : null,
			"",
			"--- Working Hours ---",
			workingHrs?.daysOfWeek
				? `Days: ${workingHrs.daysOfWeek.join(", ")}`
				: null,
			workingHrs?.startTime ? `Start: ${workingHrs.startTime}` : null,
			workingHrs?.endTime ? `End: ${workingHrs.endTime}` : null,
			workingHrs?.timeZone
				? `Working Hours Timezone: ${workingHrs.timeZone.name}`
				: null,
			"",
			"--- Auto-Replies ---",
			`Status: ${autoReplies?.status ?? "disabled"}`,
			autoReplies?.externalAudience
				? `External Audience: ${autoReplies.externalAudience}`
				: null,
			autoReplies?.scheduledStartDateTime
				? `Scheduled Start: ${autoReplies.scheduledStartDateTime.dateTime}`
				: null,
			autoReplies?.scheduledEndDateTime
				? `Scheduled End: ${autoReplies.scheduledEndDateTime.dateTime}`
				: null,
			autoReplies?.internalReplyMessage
				? `Internal Reply: ${autoReplies.internalReplyMessage.substring(0, 200)}${autoReplies.internalReplyMessage.length > 200 ? "..." : ""}`
				: null,
			autoReplies?.externalReplyMessage
				? `External Reply: ${autoReplies.externalReplyMessage.substring(0, 200)}${autoReplies.externalReplyMessage.length > 200 ? "..." : ""}`
				: null,
			"",
			settings.delegateMeetingMessageDeliveryOptions
				? `Delegate Meeting Delivery: ${settings.delegateMeetingMessageDeliveryOptions}`
				: null,
		]
			.filter((line) => line !== null)
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Mailbox Settings for ${mailbox}:\n\n${details}`,
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
					text: `Error getting mailbox settings: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleGetMailboxSettings;
