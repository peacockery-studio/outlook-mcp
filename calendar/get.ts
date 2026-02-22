/**
 * Get event functionality
 */

import { ensureAuthenticated } from "../auth";
import { CALENDAR_EVENT_DETAIL_FIELDS } from "../config";
import { callGraphAPI } from "../utils/graph-api";
import type { CalendarEvent, MCPResponse, GetEventArgs } from "./types";

/**
 * Get event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleGetEvent(args: GetEventArgs): Promise<MCPResponse> {
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
					text: "Event ID is required to get event details.",
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

		const queryParams = {
			$select: CALENDAR_EVENT_DETAIL_FIELDS,
		};

		// Make API call
		const event = (await callGraphAPI(
			accessToken,
			"GET",
			endpoint,
			null,
			queryParams,
		)) as CalendarEvent;

		// Format start/end times
		const startDate = new Date(
			event.start.dateTime +
				(event.start.dateTime.endsWith("Z") ? "" : "Z"),
		).toLocaleString();
		const endDate = new Date(
			event.end.dateTime + (event.end.dateTime.endsWith("Z") ? "" : "Z"),
		).toLocaleString();

		// Format attendees
		const attendeesList =
			event.attendees && event.attendees.length > 0
				? event.attendees
						.map(
							(a) =>
								`  - ${a.emailAddress.name ?? a.emailAddress.address} (${a.type}) [${a.status?.response ?? "unknown"}]`,
						)
						.join("\n")
				: "  None";

		// Format organizer
		const organizer = event.organizer
			? `${event.organizer.emailAddress.name ?? event.organizer.emailAddress.address}`
			: "Unknown";

		// Format location
		const location = event.location?.displayName ?? "No location";

		// Format body
		const body = event.body?.content ?? event.bodyPreview ?? "No body content";

		// Format online meeting info
		const onlineMeeting = event.isOnlineMeeting
			? `Yes${event.onlineMeetingUrl ? ` - ${event.onlineMeetingUrl}` : ""}${event.onlineMeeting?.joinUrl ? ` (Join: ${event.onlineMeeting.joinUrl})` : ""}`
			: "No";

		// Format reminder
		const reminder = event.isReminderOn
			? `Yes (${event.reminderMinutesBeforeStart ?? 15} minutes before)`
			: "No";

		// Format recurrence
		const recurrence = event.recurrence
			? JSON.stringify(event.recurrence, null, 2)
			: "None";

		const details = [
			`Subject: ${event.subject}`,
			`ID: ${event.id}`,
			`Start: ${startDate}`,
			`End: ${endDate}`,
			`All Day: ${event.isAllDay ? "Yes" : "No"}`,
			`Cancelled: ${event.isCancelled ? "Yes" : "No"}`,
			`Location: ${location}`,
			`Organizer: ${organizer}`,
			`Attendees:\n${attendeesList}`,
			`Body:\n${body}`,
			`Online Meeting: ${onlineMeeting}`,
			`Reminder: ${reminder}`,
			`Recurrence: ${recurrence}`,
		].join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Event Details:\n\n${details}`,
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
					text: `Error getting event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleGetEvent;
