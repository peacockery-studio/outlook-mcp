/**
 * Update event functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_TIMEZONE } from "../config";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import type { DateTimeTimeZone, MCPResponse, UpdateEventArgs } from "./types";

/**
 * Update event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleUpdateEvent(
	args: UpdateEventArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { eventId } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to update an event.",
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
					text: `Updating events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/events/${eventId}`;

		// Helper to extract dateTime value
		const getDateTime = (value: string | DateTimeTimeZone): string => {
			if (typeof value === "string") {
				return value;
			}
			return value.dateTime;
		};

		// Helper to extract timeZone value
		const getTimeZone = (value: string | DateTimeTimeZone): string => {
			if (typeof value === "string") {
				return DEFAULT_TIMEZONE;
			}
			return value.timeZone ?? DEFAULT_TIMEZONE;
		};

		// Build body dynamically with only provided fields
		const bodyContent: Record<string, unknown> = {};

		if (args.subject !== undefined) {
			bodyContent.subject = args.subject;
		}

		if (args.start !== undefined) {
			bodyContent.start = {
				dateTime: getDateTime(args.start),
				timeZone: getTimeZone(args.start),
			};
		}

		if (args.end !== undefined) {
			bodyContent.end = {
				dateTime: getDateTime(args.end),
				timeZone: getTimeZone(args.end),
			};
		}

		if (args.location !== undefined) {
			bodyContent.location = { displayName: args.location };
		}

		if (args.body !== undefined) {
			bodyContent.body = { contentType: "HTML", content: args.body };
		}

		if (args.attendees !== undefined) {
			bodyContent.attendees = args.attendees.map((email: string) => ({
				emailAddress: { address: email },
				type: "required",
			}));
		}

		if (args.isOnlineMeeting !== undefined) {
			bodyContent.isOnlineMeeting = args.isOnlineMeeting;
		}

		if (args.isReminderOn !== undefined) {
			bodyContent.isReminderOn = args.isReminderOn;
		}

		if (args.reminderMinutesBeforeStart !== undefined) {
			bodyContent.reminderMinutesBeforeStart =
				args.reminderMinutesBeforeStart;
		}

		// Make API call
		await callGraphAPI(accessToken, "PATCH", endpoint, bodyContent);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been successfully updated.`,
				},
			],
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

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
					text: `Error updating event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleUpdateEvent;
