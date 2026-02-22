/**
 * Cancel event functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import type { CancelEventArgs, MCPResponse } from "./types";

/**
 * Cancel event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleCancelEvent(args: CancelEventArgs): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { eventId, comment } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to cancel an event.",
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
					text: `Cancelling events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/events/${eventId}/cancel`;

		// Request body
		const body = {
			comment: comment ?? "Cancelled via API",
		};

		// Make API call
		await callGraphAPI(accessToken, "POST", endpoint, body);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been successfully cancelled.`,
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
					text: `Error cancelling event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleCancelEvent;
