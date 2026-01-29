/**
 * Delete event functionality
 */

import { ensureAuthenticated } from "../auth";
import { callGraphAPI } from "../utils/graph-api";
import type { DeleteEventArgs, MCPResponse } from "./types";

/**
 * Delete event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleDeleteEvent(args: DeleteEventArgs): Promise<MCPResponse> {
	const { eventId } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to delete an event.",
				},
			],
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `me/events/${eventId}`;

		// Make API call
		await callGraphAPI(accessToken, "DELETE", endpoint);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been successfully deleted.`,
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
					text: `Error deleting event: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleDeleteEvent;
