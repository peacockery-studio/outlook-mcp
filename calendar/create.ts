/**
 * Create event functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_TIMEZONE } from "../config";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import type { CreateEventArgs, DateTimeTimeZone, MCPResponse } from "./types";

/**
 * Create event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleCreateEvent(args: CreateEventArgs): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { subject, start, end, attendees, body } = args;

	if (!subject || !start || !end) {
		return {
			content: [
				{
					type: "text",
					text: "Subject, start, and end times are required to create an event.",
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
					text: `Creating events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/events`;

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
				isError: true,
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error creating event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleCreateEvent;
