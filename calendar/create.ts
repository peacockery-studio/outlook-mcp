/**
 * Create event functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_TIMEZONE } from "../config";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
	getCurrentUserEmail,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import type { CreateEventArgs, DateTimeTimeZone, MCPResponse } from "./types";

/**
 * Create event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleCreateEvent(args: CreateEventArgs): Promise<MCPResponse> {
	const { subject, start, end, attendees, body } = args;

	if (!subject || !start || !end) {
		return {
			content: [
				{
					type: "text",
					text: "Subject, start, and end times are required to create an event.",
				},
			],
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Check if the current mailbox has permission to modify
		const currentUserEmail = await getCurrentUserEmail(accessToken);
		if (!canModifyMailbox(currentUserEmail)) {
			return {
				content: [
					{
						type: "text",
						text: `Creating events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		// Build API endpoint
		const endpoint = "me/events";

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

		// Request body
		const bodyContent = {
			subject,
			start: {
				dateTime: getDateTime(start),
				timeZone: getTimeZone(start),
			},
			end: {
				dateTime: getDateTime(end),
				timeZone: getTimeZone(end),
			},
			attendees: attendees?.map((email: string) => ({
				emailAddress: { address: email },
				type: "required",
			})),
			body: { contentType: "HTML", content: body ?? "" },
		};

		// Make API call
		await callGraphAPI(accessToken, "POST", endpoint, bodyContent);

		return {
			content: [
				{
					type: "text",
					text: `Event '${subject}' has been successfully created.`,
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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error creating event: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleCreateEvent;
