/**
 * Configuration for Outlook MCP Server
 */

import os from "node:os";
import path from "node:path";
import type { Config } from "./types";

// Ensure we have a home directory path even if process.env.HOME is undefined
const homeDir =
	process.env.HOME ?? process.env.USERPROFILE ?? os.homedir() ?? "/tmp";

// Named exports for individual config values
export const SERVER_NAME = "outlook-assistant";
export const SERVER_VERSION = "1.0.0";
export const USE_TEST_MODE = process.env.USE_TEST_MODE === "true";
export const GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0/";
export const EMAIL_SELECT_FIELDS =
	"id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,hasAttachments,importance,isRead";
export const EMAIL_DETAIL_FIELDS =
	"id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,bodyPreview,body,hasAttachments,importance,isRead,internetMessageHeaders";
export const CALENDAR_SELECT_FIELDS =
	"id,subject,bodyPreview,start,end,location,organizer,attendees,isAllDay,isCancelled";
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_RESULT_COUNT = 50;
export const DEFAULT_TIMEZONE = "Central European Standard Time";

export const AUTH_CONFIG = {
	tenantId: process.env.MS_TENANT_ID ?? process.env.OUTLOOK_TENANT_ID ?? "",
	clientId: process.env.MS_CLIENT_ID ?? process.env.OUTLOOK_CLIENT_ID ?? "",
	clientSecret:
		process.env.MS_CLIENT_SECRET ?? process.env.OUTLOOK_CLIENT_SECRET ?? "",
	// App-only auth uses .default scope for client credentials
	scopes: ["https://graph.microsoft.com/.default"],
	tokenStorePath: path.join(homeDir, ".outlook-mcp-tokens.json"),
};

const config: Config = {
	SERVER_NAME,
	SERVER_VERSION,
	USE_TEST_MODE,
	AUTH_CONFIG,
	GRAPH_API_ENDPOINT,
	EMAIL_SELECT_FIELDS,
	EMAIL_DETAIL_FIELDS,
	CALENDAR_SELECT_FIELDS,
	DEFAULT_PAGE_SIZE,
	MAX_RESULT_COUNT,
	DEFAULT_TIMEZONE,
};

export default config;
