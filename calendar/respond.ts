/**
 * Event response functionality (tentatively accept, forward)
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import type {
	ForwardEventArgs,
	MCPResponse,
	TentativelyAcceptEventArgs,
} from "./types";

/**
 * Tentatively accept event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleTentativelyAcceptEvent(
	args: TentativelyAcceptEventArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { eventId, comment, sendResponse } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to tentatively accept an event.",
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
					text: `Tentatively accepting events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/events/${eventId}/tentativelyAccept`;

		// Request body
		const body = {
			comment: comment ?? "Tentatively accepted via API",
			sendResponse: sendResponse ?? true,
		};

		// Make API call
		await callGraphAPI(accessToken, "POST", endpoint, body);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been tentatively accepted.`,
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
					text: `Error tentatively accepting event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Forward event handler
 * @param args - Tool arguments
 * @returns MCP response
 */
async function handleForwardEvent(
	args: ForwardEventArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const { eventId, toRecipients, comment } = args;

	if (!eventId) {
		return {
			content: [
				{
					type: "text",
					text: "Event ID is required to forward an event.",
				},
			],
			isError: true,
		};
	}

	if (!toRecipients) {
		return {
			content: [
				{
					type: "text",
					text: "At least one recipient is required to forward an event.",
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
					text: `Forwarding events is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Build API endpoint
		const endpoint = `users/${mailbox}/events/${eventId}/forward`;

		// Parse comma-separated recipients
		const recipients = toRecipients
			.split(",")
			.map((email: string) => email.trim())
			.filter((email: string) => email.length > 0)
			.map((email: string) => ({
				emailAddress: { address: email },
			}));

		// Request body
		const body = {
			toRecipients: recipients,
			comment: comment ?? "",
		};

		// Make API call
		await callGraphAPI(accessToken, "POST", endpoint, body);

		return {
			content: [
				{
					type: "text",
					text: `Event with ID ${eventId} has been successfully forwarded.`,
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
					text: `Error forwarding event: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export { handleTentativelyAcceptEvent, handleForwardEvent };
