/**
 * Decline event functionality
 */

import { ensureAuthenticated } from "../auth";
import { callGraphAPI } from "../utils/graph-api";
import type { DeclineEventArgs, MCPResponse } from "./types";

/**
 * Decline event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleDeclineEvent(
	args: DeclineEventArgs,
): Promise<MCPResponse> {
	const { eventId, comment } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to decline an event.",
				},
			],
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `me/events/${eventId}/decline`;

		// Request body
		const body = {
			comment: comment ?? "Declined via API",
		};

		// Make API call
		await callGraphAPI(accessToken, "POST", endpoint, body);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been successfully declined.`,
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
					text: `Error declining event: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleDeclineEvent;
