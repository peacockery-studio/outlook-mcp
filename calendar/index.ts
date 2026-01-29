/**
 * Calendar module for Outlook MCP server
 */

import handleAcceptEvent from "./accept";
import handleCancelEvent from "./cancel";
import handleCreateEvent from "./create";
import handleDeclineEvent from "./decline";
import handleDeleteEvent from "./delete";
import handleListEvents from "./list";
import type { CalendarTool, MCPResponse } from "./types";

// Calendar tool definitions
const calendarTools: CalendarTool[] = [
	{
		name: "list-events",
		description: "Lists upcoming events from your calendar",
		inputSchema: {
			type: "object",
			properties: {
				count: {
					type: "number",
					description: "Number of events to retrieve (default: 10, max: 50)",
				},
			},
			required: [],
		},
		handler: handleListEvents as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "decline-event",
		description: "Declines a calendar event",
		inputSchema: {
			type: "object",
			properties: {
				eventId: {
					type: "string",
					description: "The ID of the event to decline",
				},
				comment: {
					type: "string",
					description: "Optional comment for declining the event",
				},
			},
			required: ["eventId"],
		},
		handler: handleDeclineEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-event",
		description: "Creates a new calendar event",
		inputSchema: {
			type: "object",
			properties: {
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
			},
			required: ["subject", "start", "end"],
		},
		handler: handleCreateEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
	{
		name: "cancel-event",
		description: "Cancels a calendar event",
		inputSchema: {
			type: "object",
			properties: {
				eventId: {
					type: "string",
					description: "The ID of the event to cancel",
				},
				comment: {
					type: "string",
					description: "Optional comment for cancelling the event",
				},
			},
			required: ["eventId"],
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
				eventId: {
					type: "string",
					description: "The ID of the event to delete",
				},
			},
			required: ["eventId"],
		},
		handler: handleDeleteEvent as unknown as (
			args: unknown,
		) => Promise<MCPResponse>,
	},
];

export {
	calendarTools,
	handleListEvents,
	handleDeclineEvent,
	handleCreateEvent,
	handleCancelEvent,
	handleDeleteEvent,
	handleAcceptEvent,
};
