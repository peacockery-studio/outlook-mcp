/**
 * List events functionality
 */

import { ensureAuthenticated } from "../auth";
import config from "../config";
import { callGraphAPI } from "../utils/graph-api";
import type {
	CalendarEvent,
	EventsListResponse,
	ListEventsArgs,
	MCPResponse,
} from "./types";

/**
 * List events handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleListEvents(args: ListEventsArgs): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const count = Math.min(args.count ?? 10, config.MAX_RESULT_COUNT);

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Use calendarView with a 30-day window — supports $orderby without $filter
		const endpoint = `users/${mailbox}/calendarView`;
		const now = new Date();
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + 30);

		const queryParams = {
			startDateTime: now.toISOString(),
			endDateTime: endDate.toISOString(),
			$top: count,
			$orderby: "start/dateTime",
			$select: config.CALENDAR_SELECT_FIELDS,
		};

		// Make API call
		const response = (await callGraphAPI(
			accessToken,
			"GET",
			endpoint,
			null,
			queryParams,
		)) as EventsListResponse;

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No calendar events found.",
					},
				],
			};
		}

		// Format results
		const eventList = response.value
			.map((event: CalendarEvent, index: number) => {
				// event.start.timeZone is a timezone name, not a locale — parse as UTC
				const startDate = new Date(
					event.start.dateTime +
						(event.start.dateTime.endsWith("Z") ? "" : "Z"),
				).toLocaleString();
				const endDate = new Date(
					event.end.dateTime + (event.end.dateTime.endsWith("Z") ? "" : "Z"),
				).toLocaleString();
				const location = event.location.displayName ?? "No location";

				return `${index + 1}. ${event.subject} - Location: ${location}\nStart: ${startDate}\nEnd: ${endDate}\nSubject: ${event.subject}\nSummary: ${event.bodyPreview}\nID: ${event.id}\n`;
			})
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${response.value.length} events:\n\n${eventList}`,
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
					text: `Error listing events: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleListEvents;
