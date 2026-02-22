/**
 * Outlook MCP Server Types
 *
 * Core types for Microsoft Graph API operations including authentication,
 * email handling, calendar events, folders, and rules.
 */

/**
 * Configuration for authenticating with Microsoft Graph API via Azure AD.
 * Uses client credentials flow (app-only auth) - no user interaction needed.
 */
export interface AuthConfig {
	/** Azure AD tenant ID */
	tenantId: string;
	/** Application (client) ID from Azure AD app registration */
	clientId: string;
	/** Client secret generated in Azure AD app registration */
	clientSecret: string;
	/** Required OAuth scopes for Microsoft Graph */
	scopes: string[];
	/** File path where tokens are stored (for backwards compat) */
	tokenStorePath: string;
}

/**
 * Server configuration for the Outlook MCP server.
 */
export interface Config {
	/** Server name identifier */
	SERVER_NAME: string;
	/** Server version */
	SERVER_VERSION: string;
	/** Whether test mode is enabled */
	USE_TEST_MODE: boolean;
	/** Authentication configuration */
	AUTH_CONFIG: AuthConfig;
	/** Microsoft Graph API endpoint */
	GRAPH_API_ENDPOINT: string;
	/** Fields to select when listing emails */
	EMAIL_SELECT_FIELDS: string;
	/** Fields to select when reading email details */
	EMAIL_DETAIL_FIELDS: string;
	/** Fields to select for calendar events */
	CALENDAR_SELECT_FIELDS: string;
	/** Default number of items per page */
	DEFAULT_PAGE_SIZE: number;
	/** Maximum number of results to return */
	MAX_RESULT_COUNT: number;
	/** Default timezone for calendar operations */
	DEFAULT_TIMEZONE: string;
}

/**
 * Represents an email address with optional display name.
 */
export interface EmailAddress {
	/** Email address */
	address: string;
	/** Display name of the recipient */
	name?: string;
}

/**
 * Wrapper for email address used in Microsoft Graph API responses.
 */
export interface EmailRecipient {
	emailAddress: EmailAddress;
}

/**
 * Email body content.
 */
export interface EmailBody {
	/** Content type: "text" or "html" */
	contentType: "text" | "html";
	/** The actual content */
	content: string;
}

/**
 * Full representation of an email message from Microsoft Graph.
 */
export interface EmailMessage {
	/** Unique Microsoft Graph message ID */
	id: string;
	/** Email subject line */
	subject: string;
	/** Sender information */
	from: EmailRecipient;
	/** Primary recipients (To field) */
	toRecipients: EmailRecipient[];
	/** Carbon copy recipients (CC field) */
	ccRecipients: EmailRecipient[];
	/** Blind carbon copy recipients (BCC field) */
	bccRecipients?: EmailRecipient[];
	/** Timestamp when the email was received */
	receivedDateTime: string;
	/** Short preview of the email body */
	bodyPreview: string;
	/** Full email body */
	body?: EmailBody;
	/** Whether the email has attachments */
	hasAttachments: boolean;
	/** Email importance level */
	importance: "low" | "normal" | "high";
	/** Whether the email has been read */
	isRead: boolean;
	/** Internet message headers */
	internetMessageHeaders?: Array<{ name: string; value: string }>;
}

/**
 * Calendar event location.
 */
export interface EventLocation {
	/** Display name of the location */
	displayName?: string;
	/** Location URI */
	locationUri?: string;
	/** Location type */
	locationType?: string;
	/** Physical address */
	address?: {
		street?: string;
		city?: string;
		state?: string;
		countryOrRegion?: string;
		postalCode?: string;
	};
}

/**
 * Date/time with timezone information.
 */
export interface DateTimeTimeZone {
	/** ISO 8601 date-time string */
	dateTime: string;
	/** Timezone identifier */
	timeZone: string;
}

/**
 * Calendar event attendee.
 */
export interface Attendee {
	/** Email address of the attendee */
	emailAddress: EmailAddress;
	/** Type of attendee */
	type?: "required" | "optional" | "resource";
	/** Response status */
	status?: {
		response:
			| "none"
			| "organizer"
			| "tentativelyAccepted"
			| "accepted"
			| "declined"
			| "notResponded";
		time?: string;
	};
}

/**
 * Calendar event from Microsoft Graph.
 */
export interface CalendarEvent {
	/** Unique Microsoft Graph event ID */
	id: string;
	/** Event subject/title */
	subject: string;
	/** Short preview of the event body */
	bodyPreview?: string;
	/** Full event body */
	body?: EmailBody;
	/** Event start time */
	start: DateTimeTimeZone;
	/** Event end time */
	end: DateTimeTimeZone;
	/** Event location */
	location?: EventLocation;
	/** Event organizer */
	organizer?: EmailRecipient;
	/** List of attendees */
	attendees?: Attendee[];
	/** Whether this is an all-day event */
	isAllDay?: boolean;
	/** Whether the event is cancelled */
	isCancelled?: boolean;
	/** Whether this is an online meeting */
	isOnlineMeeting?: boolean;
	/** Online meeting URL */
	onlineMeetingUrl?: string;
}

/**
 * Mail folder from Microsoft Graph.
 */
export interface MailFolder {
	/** Unique folder ID */
	id: string;
	/** Display name of the folder */
	displayName: string;
	/** Parent folder ID */
	parentFolderId?: string;
	/** Number of child folders */
	childFolderCount?: number;
	/** Number of unread items */
	unreadItemCount?: number;
	/** Total number of items */
	totalItemCount?: number;
}

/**
 * Message rule action.
 */
export interface RuleActions {
	/** Move to folder ID */
	moveToFolder?: string;
	/** Copy to folder ID */
	copyToFolder?: string;
	/** Delete the message */
	delete?: boolean;
	/** Mark as read */
	markAsRead?: boolean;
	/** Mark importance level */
	markImportance?: "low" | "normal" | "high";
	/** Forward to recipients */
	forwardTo?: EmailRecipient[];
	/** Forward as attachment to recipients */
	forwardAsAttachmentTo?: EmailRecipient[];
	/** Redirect to recipients */
	redirectTo?: EmailRecipient[];
	/** Stop processing more rules */
	stopProcessingRules?: boolean;
}

/**
 * Message rule conditions.
 */
export interface RuleConditions {
	/** Sender contains these strings */
	senderContains?: string[];
	/** Subject contains these strings */
	subjectContains?: string[];
	/** Body contains these strings */
	bodyContains?: string[];
	/** From addresses */
	fromAddresses?: EmailRecipient[];
	/** Has attachments */
	hasAttachments?: boolean;
	/** Importance level */
	importance?: "low" | "normal" | "high";
	/** Is meeting request */
	isMeetingRequest?: boolean;
	/** Is meeting response */
	isMeetingResponse?: boolean;
	/** Sent only to me */
	sentOnlyToMe?: boolean;
	/** Sent to me */
	sentToMe?: boolean;
	/** Sent CC to me */
	sentCcMe?: boolean;
	/** Header contains these strings */
	headerContains?: string[];
}

/**
 * Message rule from Microsoft Graph.
 */
export interface MessageRule {
	/** Unique rule ID */
	id: string;
	/** Display name of the rule */
	displayName: string;
	/** Sequence number for rule order */
	sequence: number;
	/** Whether the rule is enabled */
	isEnabled: boolean;
	/** Rule conditions */
	conditions?: RuleConditions;
	/** Exception conditions */
	exceptions?: RuleConditions;
	/** Actions to perform */
	actions?: RuleActions;
}

/**
 * Generic Microsoft Graph API response with array of values.
 */
export interface GraphApiListResponse<T> {
	/** Array of returned items */
	value: T[];
	/** Next page link for pagination */
	"@odata.nextLink"?: string;
	/** Total count of items */
	"@odata.count"?: number;
}

/**
 * Query parameters for Microsoft Graph API requests.
 */
export interface GraphApiQueryParams {
	/** Fields to select */
	$select?: string;
	/** Filter expression */
	$filter?: string;
	/** Order by expression */
	$orderby?: string;
	/** Number of items to return */
	$top?: number;
	/** Number of items to skip */
	$skip?: number;
	/** Search expression */
	$search?: string;
	/** Whether to include count */
	$count?: boolean;
	/** Expand related entities */
	$expand?: string;
	/** Additional parameters */
	[key: string]: string | number | boolean | undefined;
}

/**
 * HTTP methods supported by the Graph API client.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * JSON Schema for tool input parameters.
 */
export interface JsonSchema {
	type: string;
	properties?: Record<string, JsonSchemaProperty>;
	required?: string[];
	additionalProperties?: boolean;
	items?: JsonSchema;
}

/**
 * Property definition in a JSON schema.
 */
export interface JsonSchemaProperty {
	type: string;
	description?: string;
	enum?: string[];
	default?: unknown;
	items?: JsonSchema;
	properties?: Record<string, JsonSchemaProperty>;
	required?: string[];
}

/**
 * MCP Tool response format.
 */
export interface ToolResponse {
	content: Array<{
		type: "text";
		text: string;
	}>;
	/** Set to true when the tool encountered an error, so clients can distinguish failure from success */
	isError?: boolean;
}

/**
 * MCP Tool definition.
 */
export interface Tool {
	/** Unique tool name */
	name: string;
	/** Tool description */
	description: string;
	/** JSON Schema for input parameters */
	inputSchema: JsonSchema;
	/** Tool handler function */
	handler: (args: Record<string, unknown>) => Promise<ToolResponse>;
}
