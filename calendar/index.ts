/**
 * Calendar module for Outlook MCP server
 */

import handleAcceptEvent from "./accept";
import handleCancelEvent from "./cancel";
import handleCreateEvent from "./create";
import handleDeclineEvent from "./decline";
import handleDeleteEvent from "./delete";
import handleGetEvent from "./get";
import handleListEvents from "./list";
import { handleTentativelyAcceptEvent, handleForwardEvent } from "./respond";
import handleGetFreeBusy from "./schedule";
import handleUpdateEvent from "./update";
import type { CalendarTool, MCPResponse } from "./types";

// Calendar tool definitions
const calendarTools: CalendarTool[] = [
	{
		name: "list-events",
		description: "Lists upcoming events from your calendar",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				count: {
					type: "number",
					description: "Number of events to retrieve (default: 10, max: 50)",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleListEvents as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-event",
		description: "Gets detailed information about a specific calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to retrieve",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleGetEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "accept-event",
		description: "Accepts a calendar event invitation",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to accept",
				},
				comment: {
					type: "string",
					description: "Optional comment for accepting the event",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleAcceptEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "decline-event",
		description: "Declines a calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to decline",
				},
				comment: {
					type: "string",
					description: "Optional comment for declining the event",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleDeclineEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "tentatively-accept-event",
		description: "Tentatively accepts a calendar event invitation",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to tentatively accept",
				},
				comment: {
					type: "string",
					description: "Optional comment for tentatively accepting the event",
				},
				sendResponse: {
					type: "boolean",
					description:
						"Whether to send a response to the organizer (default: true)",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleTentativelyAcceptEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "forward-event",
		description: "Forwards a calendar event to specified recipients",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to forward",
				},
				toRecipients: {
					type: "string",
					description:
						"Comma-separated list of recipient email addresses",
				},
				comment: {
					type: "string",
					description: "Optional comment to include when forwarding",
				},
			},
			required: ["mailbox", "eventId", "toRecipients"],
			additionalProperties: false,
		},
		handler: handleForwardEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-event",
		description: "Creates a new calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				subject: {
					type: "string",
					description: "The subject of the event",
				},
				start: {
					type: "string",
					description: "The start time of the event in ISO 8601 format",
				},
				end: {
					type: "string",
					description: "The end time of the event in ISO 8601 format",
				},
				attendees: {
					type: "array",
					items: {
						type: "string",
					},
					description: "List of attendee email addresses",
				},
				body: {
					type: "string",
					description: "Optional body content for the event",
				},
				isOnlineMeeting: {
					type: "boolean",
					description: "Whether the event is an online meeting",
				},
				onlineMeetingProvider: {
					type: "string",
					description:
						"Online meeting provider (default: 'teamsForBusiness')",
				},
				isReminderOn: {
					type: "boolean",
					description: "Whether a reminder is set for the event",
				},
				reminderMinutesBeforeStart: {
					type: "number",
					description: "Number of minutes before the event to show a reminder",
				},
			},
			required: ["mailbox", "subject", "start", "end"],
			additionalProperties: false,
		},
		handler: handleCreateEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "update-event",
		description: "Updates an existing calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to update",
				},
				subject: {
					type: "string",
					description: "New subject for the event",
				},
				start: {
					type: "string",
					description: "New start time in ISO 8601 format",
				},
				end: {
					type: "string",
					description: "New end time in ISO 8601 format",
				},
				location: {
					type: "string",
					description: "New location for the event",
				},
				body: {
					type: "string",
					description: "New body content for the event",
				},
				attendees: {
					type: "array",
					items: {
						type: "string",
					},
					description: "New list of attendee email addresses",
				},
				isOnlineMeeting: {
					type: "boolean",
					description: "Whether the event is an online meeting",
				},
				isReminderOn: {
					type: "boolean",
					description: "Whether a reminder is set for the event",
				},
				reminderMinutesBeforeStart: {
					type: "number",
					description: "Number of minutes before the event to show a reminder",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleUpdateEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "cancel-event",
		description: "Cancels a calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to cancel",
				},
				comment: {
					type: "string",
					description: "Optional comment for cancelling the event",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleCancelEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "delete-event",
		description: "Deletes a calendar event",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				eventId: {
					type: "string",
					description: "The ID of the event to delete",
				},
			},
			required: ["mailbox", "eventId"],
			additionalProperties: false,
		},
		handler: handleDeleteEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-free-busy",
		description:
			"Gets free/busy schedule information for one or more people",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				schedules: {
					type: "array",
					items: {
						type: "string",
					},
					description: "List of email addresses to check availability for",
				},
				startTime: {
					type: "string",
					description: "Start of the time range in ISO 8601 format",
				},
				endTime: {
					type: "string",
					description: "End of the time range in ISO 8601 format",
				},
				availabilityViewInterval: {
					type: "number",
					description:
						"Duration of each time slot in minutes (default: 30)",
				},
			},
			required: ["mailbox", "schedules", "startTime", "endTime"],
			additionalProperties: false,
		},
		handler: handleGetFreeBusy as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
];

export {
	calendarTools,
	handleListEvents,
	handleGetEvent,
	handleDeclineEvent,
	handleAcceptEvent,
	handleTentativelyAcceptEvent,
	handleForwardEvent,
	handleCreateEvent,
	handleUpdateEvent,
	handleCancelEvent,
	handleDeleteEvent,
	handleGetFreeBusy,
};
