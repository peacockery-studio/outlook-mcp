/**
 * Free/busy schedule functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_TIMEZONE } from "../config";
import { callGraphAPI } from "../utils/graph-api";
import type { GetFreeBusyArgs, MCPResponse } from "./types";

/**
 * Schedule item from the Graph API response
 */
interface ScheduleItem {
	status: string;
	start: { dateTime: string; timeZone: string };
	end: { dateTime: string; timeZone: string };
	subject?: string;
	location?: string;
}

/**
 * Schedule response entry from the Graph API
 */
interface ScheduleEntry {
	scheduleId: string;
	availabilityView: string;
	scheduleItems: ScheduleItem[];
	error?: { message: string };
}

/**
 * Graph API response for getSchedule
 */
interface GetScheduleResponse {
	value: ScheduleEntry[];
}

/**
 * Get free/busy schedule handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleGetFreeBusy(
	args: GetFreeBusyArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { schedules, startTime, endTime, availabilityViewInterval } = args;

	if (!schedules || schedules.length === 0) {
		return {
			content: [
				{
					type: "text",
					text: "At least one schedule email address is required.",
				},
			],
			isError: true,
		};
	}

	if (!startTime || !endTime) {
		return {
			content: [
				{
					type: "text",
					text: "Start time and end time are required.",
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/calendar/getSchedule`;

		// Request body
		const body = {
			schedules,
			startTime: {
				dateTime: startTime,
				timeZone: DEFAULT_TIMEZONE,
			},
			endTime: {
				dateTime: endTime,
				timeZone: DEFAULT_TIMEZONE,
			},
			availabilityViewInterval: availabilityViewInterval ?? 30,
		};

		// Make API call
		const response = (await callGraphAPI(
			accessToken,
			"POST",
			endpoint,
			body,
		)) as GetScheduleResponse;

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No schedule information returned.",
					},
				],
			};
		}

		// Availability legend
		const availabilityLegend =
			"Availability: 0=Free, 1=Tentative, 2=Busy, 3=Out of Office, 4=Working Elsewhere";

		// Format results
		const scheduleList = response.value
			.map((entry: ScheduleEntry) => {
				if (entry.error) {
					return `${entry.scheduleId}: Error - ${entry.error.message}`;
				}

				const items =
					entry.scheduleItems && entry.scheduleItems.length > 0
						? entry.scheduleItems
								.map((item: ScheduleItem) => {
									const start = new Date(
										item.start.dateTime +
											(item.start.dateTime.endsWith("Z")
												? ""
												: "Z"),
									).toLocaleString();
									const end = new Date(
										item.end.dateTime +
											(item.end.dateTime.endsWith("Z")
												? ""
												: "Z"),
									).toLocaleString();
									return `    - ${item.subject ?? "Busy"} (${item.status}): ${start} - ${end}${item.location ? ` @ ${item.location}` : ""}`;
								})
								.join("\n")
						: "    No scheduled items";

				return `${entry.scheduleId}:\n  Availability View: ${entry.availabilityView}\n  Schedule Items:\n${items}`;
			})
			.join("\n\n");

		return {
			content: [
				{
					type: "text",
					text: `${availabilityLegend}\n\n${scheduleList}`,
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
					text: `Error getting free/busy schedule: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleGetFreeBusy;
