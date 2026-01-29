/**
 * Cancel event functionality
 */

import { ensureAuthenticated } from "../auth";
import { callGraphAPI } from "../utils/graph-api";
import type { CancelEventArgs, MCPResponse } from "./types";

/**
 * Cancel event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleCancelEvent(args: CancelEventArgs): Promise<MCPResponse> {
	const { eventId, comment } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to cancel an event.",
				},
			],
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `me/events/${eventId}/cancel`;

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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error cancelling event: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleCancelEvent;
