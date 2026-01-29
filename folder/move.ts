/**
 * Move emails functionality
 */

import { ensureAuthenticated } from "../auth/index.js";
import type { MCPResponse } from "../auth/tools.js";
import { getFolderIdByName } from "../email/folder-utils.js";
import { callGraphAPI } from "../utils/graph-api.js";

export interface MoveEmailsArgs {
	emailIds: string;
	targetFolder: string;
	sourceFolder?: string;
}

export interface MoveEmailsResult {
	success: boolean;
	message: string;
	results?: {
		successful: string[];
		failed: Array<{ id: string; error: string }>;
	};
}

/**
 * Move emails handler
 */
export async function handleMoveEmails(
	args: MoveEmailsArgs,
): Promise<MCPResponse> {
	const emailIds = args.emailIds || "";
	const targetFolder = args.targetFolder || "";
	const sourceFolder = args.sourceFolder || "";

	if (!emailIds) {
		return {
			content: [
				{
					type: "text",
					text: "Email IDs are required. Please provide a comma-separated list of email IDs to move.",
				},
			],
		};
	}

	if (!targetFolder) {
		return {
			content: [
				{
					type: "text",
					text: "Target folder name is required.",
				},
			],
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const ids = emailIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id);

		if (ids.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No valid email IDs provided.",
					},
				],
			};
		}

		const result = await moveEmailsToFolder(
			accessToken,
			ids,
			targetFolder,
			sourceFolder,
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
					text: `Error moving emails: ${(error as Error).message}`,
				},
			],
		};
	}
}

/**
 * Move emails to a folder
 */
async function moveEmailsToFolder(
	accessToken: string,
	emailIds: string[],
	targetFolderName: string,
	_sourceFolderName: string,
): Promise<MoveEmailsResult> {
	try {
		const targetFolderId = await getFolderIdByName(
			accessToken,
			targetFolderName,
		);
		if (!targetFolderId) {
			return {
				success: false,
				message: `Target folder "${targetFolderName}" not found. Please specify a valid folder name.`,
			};
		}

		const results: {
			successful: string[];
			failed: Array<{ id: string; error: string }>;
		} = {
			successful: [],
			failed: [],
		};

		for (const emailId of emailIds) {
			try {
				await callGraphAPI(accessToken, "POST", `me/messages/${emailId}/move`, {
					destinationId: targetFolderId,
				});

				results.successful.push(emailId);
			} catch (error) {
				console.error(
					`Error moving email ${emailId}: ${(error as Error).message}`,
				);
				results.failed.push({
					id: emailId,
					error: (error as Error).message,
				});
			}
		}

		let message = "";

		if (results.successful.length > 0) {
			message += `Successfully moved ${results.successful.length} email(s) to "${targetFolderName}".`;
		}

		if (results.failed.length > 0) {
			if (message) message += "\n\n";
			message += `Failed to move ${results.failed.length} email(s). Errors:`;

			const maxErrors = Math.min(results.failed.length, 3);
			for (let i = 0; i < maxErrors; i++) {
				const failure = results.failed[i];
				message += `\n- Email ${i + 1}: ${failure.error}`;
			}

			if (results.failed.length > maxErrors) {
				message += `\n...and ${results.failed.length - maxErrors} more.`;
			}
		}

		return {
			success: results.successful.length > 0,
			message,
			results,
		};
	} catch (error) {
		console.error(`Error in moveEmailsToFolder: ${(error as Error).message}`);
		throw error;
	}
}

export default handleMoveEmails;
