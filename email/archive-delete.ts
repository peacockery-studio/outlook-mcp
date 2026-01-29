/**
 * Archive and delete email functionality
 *
 * Provides tools for archiving and deleting emails via Microsoft Graph API.
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
	getCurrentUserEmail,
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
}

/**
 * Arguments for archive email handler
 */
interface ArchiveEmailArgs {
	id?: string;
}

/**
 * Arguments for delete email handler
 */
interface DeleteEmailArgs {
	id?: string;
	permanent?: boolean;
}

/**
 * Tool definition structure
 */
interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<
			string,
			{
				type: string;
				description: string;
			}
		>;
		required: string[];
	};
	handler: (args: Record<string, unknown>) => Promise<MCPResponse>;
}

/**
 * Archive email handler
 *
 * Moves an email to the Archive folder using the Graph API move endpoint.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleArchiveEmail(
	args: ArchiveEmailArgs,
): Promise<MCPResponse> {
	const emailId = args.id;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Email ID is required.",
				},
			],
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Check if the current mailbox has permission to modify
		const currentUserEmail = await getCurrentUserEmail(accessToken);
		if (!canModifyMailbox(currentUserEmail)) {
			return {
				content: [
					{
						type: "text",
						text: `Archiving is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		const endpoint = `me/messages/${encodeURIComponent(emailId)}/move`;
		const moveData = {
			destinationId: "archive",
		};

		try {
			await callGraphAPI(accessToken, "POST", endpoint, moveData);

			return {
				content: [
					{
						type: "text",
						text: "Email successfully moved to Archive.",
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
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to archive email: ${errorMessage}`,
					},
				],
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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error accessing email: ${errorMessage}`,
				},
			],
		};
	}
}

/**
 * Delete email handler
 *
 * Moves an email to Deleted Items (soft delete) or permanently deletes it.
 * By default, performs a soft delete which moves the email to the Deleted Items folder.
 * If permanent is true, the email is permanently deleted and cannot be recovered.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleDeleteEmail(
	args: DeleteEmailArgs,
): Promise<MCPResponse> {
	const emailId = args.id;
	const permanent = args.permanent ?? false;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Email ID is required.",
				},
			],
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		// Check if the current mailbox has permission to modify
		const currentUserEmail = await getCurrentUserEmail(accessToken);
		if (!canModifyMailbox(currentUserEmail)) {
			return {
				content: [
					{
						type: "text",
						text: `Deleting is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		try {
			if (permanent) {
				// Permanent delete using DELETE method
				const endpoint = `me/messages/${encodeURIComponent(emailId)}`;
				await callGraphAPI(accessToken, "DELETE", endpoint);

				return {
					content: [
						{
							type: "text",
							text: "Email permanently deleted.",
						},
					],
				};
			}

			// Soft delete - move to Deleted Items folder
			const endpoint = `me/messages/${encodeURIComponent(emailId)}/move`;
			const moveData = {
				destinationId: "deleteditems",
			};
			await callGraphAPI(accessToken, "POST", endpoint, moveData);

			return {
				content: [
					{
						type: "text",
						text: "Email moved to Deleted Items.",
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
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to delete email: ${errorMessage}`,
					},
				],
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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error accessing email: ${errorMessage}`,
				},
			],
		};
	}
}

/**
 * Archive and delete tool definitions
 */
export const archiveDeleteTools: ToolDefinition[] = [
	{
		name: "archive-email",
		description: "Moves an email to the Archive folder.",
		inputSchema: {
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "ID of the email to archive",
				},
			},
			required: ["id"],
		},
		handler: handleArchiveEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "delete-email",
		description:
			"Deletes an email. By default, moves to Deleted Items (soft delete). Set permanent=true to permanently delete the email (cannot be recovered).",
		inputSchema: {
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "ID of the email to delete",
				},
				permanent: {
					type: "boolean",
					description:
						"If true, permanently deletes the email. If false (default), moves to Deleted Items.",
				},
			},
			required: ["id"],
		},
		handler: handleDeleteEmail as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export default archiveDeleteTools;
