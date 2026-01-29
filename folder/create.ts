/**
 * Create folder functionality
 */

import { ensureAuthenticated } from "../auth/index.js";
import type { MCPResponse } from "../auth/tools.js";
import { getFolderIdByName } from "../email/folder-utils.js";
import { callGraphAPI } from "../utils/graph-api.js";

export interface CreateFolderArgs {
	name: string;
	parentFolder?: string;
}

export interface CreateFolderResult {
	success: boolean;
	message: string;
	folderId?: string;
}

/**
 * Create folder handler
 */
export async function handleCreateFolder(
	args: CreateFolderArgs,
): Promise<MCPResponse> {
	const folderName = args.name;
	const parentFolder = args.parentFolder || "";

	if (!folderName) {
		return {
			content: [
				{
					type: "text",
					text: "Folder name is required.",
				},
			],
		};
	}

	try {
		const accessToken = await ensureAuthenticated();
		const result = await createMailFolder(
			accessToken,
			folderName,
			parentFolder,
		);

		return {
			content: [
				{
					type: "text",
					text: result.message,
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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error creating folder: ${(error as Error).message}`,
				},
			],
		};
	}
}

/**
 * Create a new mail folder
 */
async function createMailFolder(
	accessToken: string,
	folderName: string,
	parentFolderName: string,
): Promise<CreateFolderResult> {
	try {
		const existingFolder = await getFolderIdByName(accessToken, folderName);
		if (existingFolder) {
			return {
				success: false,
				message: `A folder named "${folderName}" already exists.`,
			};
		}

		let endpoint = "me/mailFolders";
		if (parentFolderName) {
			const parentId = await getFolderIdByName(accessToken, parentFolderName);
			if (!parentId) {
				return {
					success: false,
					message: `Parent folder "${parentFolderName}" not found. Please specify a valid parent folder or leave it blank to create at the root level.`,
				};
			}

			endpoint = `me/mailFolders/${parentId}/childFolders`;
		}

		const folderData = {
			displayName: folderName,
		};

		const response = await callGraphAPI<{ id: string; displayName: string }>(
			accessToken,
			"POST",
			endpoint,
			folderData,
		);

		if (response?.id) {
			const locationInfo = parentFolderName
				? `inside "${parentFolderName}"`
				: "at the root level";

			return {
				success: true,
				message: `Successfully created folder "${folderName}" ${locationInfo}.`,
				folderId: response.id,
			};
		}
		return {
			success: false,
			message: "Failed to create folder. The server didn't return a folder ID.",
		};
	} catch (error) {
		console.error(
			`Error creating folder "${folderName}": ${(error as Error).message}`,
		);
		throw error;
	}
}

export default handleCreateFolder;
