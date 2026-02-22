/**
 * Flag email functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";

/**
 * MCP response content item
 */
interface MCPContentItem {
	type: "text";
	text: string;
}

/**
 * MCP response structure
 */
interface MCPResponse {
	content: MCPContentItem[];
	isError?: boolean;
}

/**
 * Arguments for flag email handler
 */
interface FlagEmailArgs {
	mailbox?: string;
	id?: string;
	flagStatus?: "notFlagged" | "flagged" | "complete";
	startDateTime?: string;
	dueDateTime?: string;
}

/**
 * Flag object for Graph API
 */
interface FlagObject {
	flagStatus: string;
	startDateTime?: {
		dateTime: string;
		timeZone: string;
	};
	dueDateTime?: {
		dateTime: string;
		timeZone: string;
	};
}

/**
 * Flag email handler
 *
 * Sets the flag status on an email. Can optionally set start and due dates.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleFlagEmail(
	args: FlagEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const flagStatus = args.flagStatus;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Email ID is required.",
				},
			],
			isError: true,
		};
	}

	if (!flagStatus) {
		return {
			content: [
				{
					type: "text",
					text: "Flag status is required (notFlagged, flagged, or complete).",
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
					text: `Modifying emails is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Build flag object
		const flag: FlagObject = {
			flagStatus,
		};

		if (args.startDateTime) {
			flag.startDateTime = {
				dateTime: args.startDateTime,
				timeZone: "UTC",
			};
		}

		if (args.dueDateTime) {
			flag.dueDateTime = {
				dateTime: args.dueDateTime,
				timeZone: "UTC",
			};
		}

		const updateData = { flag };

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}`;

		try {
			await callGraphAPI(accessToken, "PATCH", endpoint, updateData);

			let statusText = `Email flag set to "${flagStatus}".`;
			if (args.startDateTime) {
				statusText += `\nStart: ${args.startDateTime}`;
			}
			if (args.dueDateTime) {
				statusText += `\nDue: ${args.dueDateTime}`;
			}

			return {
				content: [
					{
						type: "text",
						text: statusText,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			if (errorMessage.includes("doesn't belong to the targeted mailbox")) {
				return {
					content: [
						{
							type: "text",
							text: "The email ID seems invalid or doesn't belong to your mailbox. Please try with a different email ID.",
						},
					],
					isError: true,
				};
			}
			if (errorMessage.includes("UNAUTHORIZED")) {
				return {
					content: [
						{
							type: "text",
							text: "Authentication failed. Please re-authenticate and try again.",
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to flag email: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

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
					text: `Error accessing email: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleFlagEmail;
