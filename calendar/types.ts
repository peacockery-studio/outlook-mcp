/**
 * Type definitions for Calendar module
 */

/**
 * MCP response content item
 */
export interface MCPContentItem {
	type: "text";
	text: string;
}

/**
 * MCP response structure
 */
export interface MCPResponse {
	content: MCPContentItem[];
	isError?: boolean;
}

/**
 * Date/time structure from Microsoft Graph API
 */
export interface DateTimeTimeZone {
	dateTime: string;
	timeZone: string;
}

/**
 * Location structure from Microsoft Graph API
 */
export interface Location {
	displayName?: string;
	locationType?: string;
	uniqueId?: string;
	uniqueIdType?: string;
}

/**
 * Email address structure
 */
export interface EmailAddress {
	address: string;
	name?: string;
}

/**
 * Attendee structure from Microsoft Graph API
 */
export interface Attendee {
	emailAddress: EmailAddress;
	type: "required" | "optional" | "resource";
	status?: {
		response?: string;
		time?: string;
	};
}

/**
 * Organizer structure from Microsoft Graph API
 */
export interface Organizer {
	emailAddress: EmailAddress;
}

/**
 * Calendar event from Microsoft Graph API
 */
export interface CalendarEvent {
	id: string;
	subject: string;
	bodyPreview?: string;
	body?: {
		contentType: "text" | "HTML";
		content: string;
	};
	start: DateTimeTimeZone;
	end: DateTimeTimeZone;
	location: Location;
	organizer?: Organizer;
	attendees?: Attendee[];
	isAllDay?: boolean;
	isCancelled?: boolean;
	isOnlineMeeting?: boolean;
	onlineMeetingUrl?: string;
	onlineMeeting?: {
		joinUrl?: string;
	};
	isReminderOn?: boolean;
	reminderMinutesBeforeStart?: number;
	recurrence?: unknown;
	seriesMasterId?: string;
	type?: string;
	categories?: string[];
}

/**
 * Graph API response for events list
 */
export interface EventsListResponse {
	value: CalendarEvent[];
	"@odata.nextLink"?: string;
	"@odata.count"?: number;
}

/**
 * Arguments for list-events tool
 */
export interface ListEventsArgs {
	count?: number;
	mailbox?: string;
}

/**
 * Arguments for create-event tool
 */
export interface CreateEventArgs {
	subject: string;
	start: string | DateTimeTimeZone;
	end: string | DateTimeTimeZone;
	attendees?: string[];
	body?: string;
	isOnlineMeeting?: boolean;
	onlineMeetingProvider?: string;
	isReminderOn?: boolean;
	reminderMinutesBeforeStart?: number;
	mailbox?: string;
}

/**
 * Arguments for accept-event tool
 */
export interface AcceptEventArgs {
	eventId: string;
	comment?: string;
	mailbox?: string;
}

/**
 * Arguments for decline-event tool
 */
export interface DeclineEventArgs {
	eventId: string;
	comment?: string;
	mailbox?: string;
}

/**
 * Arguments for cancel-event tool
 */
export interface CancelEventArgs {
	eventId: string;
	comment?: string;
	mailbox?: string;
}

/**
 * Arguments for delete-event tool
 */
export interface DeleteEventArgs {
	eventId: string;
	mailbox?: string;
}

/**
 * Arguments for get-event tool
 */
export interface GetEventArgs {
	eventId: string;
	mailbox?: string;
}

/**
 * Arguments for update-event tool
 */
export interface UpdateEventArgs {
	eventId: string;
	subject?: string;
	start?: string | DateTimeTimeZone;
	end?: string | DateTimeTimeZone;
	location?: string;
	body?: string;
	attendees?: string[];
	isOnlineMeeting?: boolean;
	isReminderOn?: boolean;
	reminderMinutesBeforeStart?: number;
	mailbox?: string;
}

/**
 * Arguments for tentatively-accept-event tool
 */
export interface TentativelyAcceptEventArgs {
	eventId: string;
	comment?: string;
	sendResponse?: boolean;
	mailbox?: string;
}

/**
 * Arguments for forward-event tool
 */
export interface ForwardEventArgs {
	eventId: string;
	toRecipients: string;
	comment?: string;
	mailbox?: string;
}

/**
 * Arguments for get-free-busy tool
 */
export interface GetFreeBusyArgs {
	schedules: string[];
	startTime: string;
	endTime: string;
	availabilityViewInterval?: number;
	mailbox?: string;
}

/**
 * Tool input schema property
 */
export interface ToolInputSchemaProperty {
	type: string;
	description: string;
	items?: {
		type: string;
	};
}

/**
 * Tool input schema
 */
export interface ToolInputSchema {
	type: "object";
	properties: Record<string, ToolInputSchemaProperty>;
	required: string[];
	additionalProperties?: boolean;
}

/**
 * Calendar tool handler function type
 */
export type CalendarToolHandler<T = unknown> = (
	args: T,
) => Promise<MCPResponse>;

/**
 * Calendar tool definition
 */
export interface CalendarTool {
	name: string;
	description: string;
	inputSchema: ToolInputSchema;
	handler: CalendarToolHandler;
}
