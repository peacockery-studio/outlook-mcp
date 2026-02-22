/**
 * Copy email functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { callGraphAPI } from "../utils/graph-api";
import { getFolderIdByName } from "./folder-utils";

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
 * Arguments for copy email handler
 */
interface CopyEmailArgs {
	mailbox?: string;
	id?: string;
	destinationFolder?: string;
}

/**
 * Well-known folder name mapping to Graph API folder identifiers
 */
const WELL_KNOWN_FOLDER_NAMES: Record<string, string> = {
	inbox: "inbox",
	drafts: "drafts",
	sent: "sentItems",
	deleted: "deletedItems",
	deleteditems: "deletedItems",
	archive: "archive",
	junk: "junkemail",
	junkemail: "junkemail",
};

/**
 * Copy email handler
 *
 * Copies an email to a specified folder.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleCopyEmail(
	args: CopyEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;
	const destinationFolder = args.destinationFolder;

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

	if (!destinationFolder) {
		return {
			content: [
				{
					type: "text",
					text: "Destination folder is required.",
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

		// Resolve the destination folder to its ID
		const lowerFolder = destinationFolder.toLowerCase();
		let destinationId: string;

		if (WELL_KNOWN_FOLDER_NAMES[lowerFolder]) {
			// Use well-known folder name directly
			destinationId = WELL_KNOWN_FOLDER_NAMES[lowerFolder];
		} else {
			// Look up the folder by name to get its ID
			const folderId = await getFolderIdByName(
				accessToken,
				destinationFolder,
				mailbox,
			);
			if (!folderId) {
				return {
					content: [
						{
							type: "text",
							text: `Folder "${destinationFolder}" not found. Please check the folder name and try again.`,
						},
					],
					isError: true,
				};
			}
			destinationId = folderId;
		}

		const copyData = {
			destinationId,
		};

		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}/copy`;

		try {
			await callGraphAPI(accessToken, "POST", endpoint, copyData);

			return {
				content: [
					{
						type: "text",
						text: `Email copied successfully to "${destinationFolder}".`,
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
						text: `Failed to copy email: ${errorMessage}`,
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

export default handleCopyEmail;
