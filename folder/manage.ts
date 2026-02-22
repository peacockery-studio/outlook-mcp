/**
 * Folder rename and delete functionality
 */

import { ensureAuthenticated } from "../auth/index";
import type { MCPResponse } from "../auth/tools";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
} from "../config/mailbox-permissions";
import { getFolderIdByName } from "../email/folder-utils";
import { callGraphAPI } from "../utils/graph-api";

export interface RenameFolderArgs {
	mailbox?: string;
	folderName?: string;
	newName?: string;
}

export interface DeleteFolderArgs {
	mailbox?: string;
	folderName?: string;
}

/**
 * Rename folder handler
 */
export async function handleRenameFolder(
	args: RenameFolderArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const folderName = args.folderName;
	if (!folderName) {
		return {
			content: [
				{
					type: "text",
					text: "Folder name is required.",
				},
			],
			isError: true,
		};
	}

	const newName = args.newName;
	if (!newName) {
		return {
			content: [
				{
					type: "text",
					text: "New folder name is required.",
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
					text: `Renaming folders is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const folderId = await getFolderIdByName(
			accessToken,
			folderName,
			mailbox,
		);
		if (!folderId) {
			return {
				content: [
					{
						type: "text",
						text: `Folder "${folderName}" not found. Please specify a valid folder name.`,
					},
				],
				isError: true,
			};
		}

		await callGraphAPI(
			accessToken,
			"PATCH",
			`users/${mailbox}/mailFolders/${folderId}`,
			{ displayName: newName },
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully renamed folder "${folderName}" to "${newName}".`,
				},
			],
		};
	} catch (error) {
		if ((error as Error).message === "Authentication required") {
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
					text: `Error renaming folder: ${(error as Error).message}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Delete folder handler
 */
export async function handleDeleteFolder(
	args: DeleteFolderArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const folderName = args.folderName;
	if (!folderName) {
		return {
			content: [
				{
					type: "text",
					text: "Folder name is required.",
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
					text: `Deleting folders is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const folderId = await getFolderIdByName(
			accessToken,
			folderName,
			mailbox,
		);
		if (!folderId) {
			return {
				content: [
					{
						type: "text",
						text: `Folder "${folderName}" not found. Please specify a valid folder name.`,
					},
				],
				isError: true,
			};
		}

		await callGraphAPI(
			accessToken,
			"DELETE",
			`users/${mailbox}/mailFolders/${folderId}`,
		);

		return {
			content: [
				{
					type: "text",
					text: `Successfully deleted folder "${folderName}".`,
				},
			],
		};
	} catch (error) {
		if ((error as Error).message === "Authentication required") {
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
					text: `Error deleting folder: ${(error as Error).message}`,
				},
			],
			isError: true,
		};
	}
}
