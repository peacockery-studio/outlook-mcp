/**
 * Task list management functionality
 */

import { ensureAuthenticated } from "../auth";
import { TASK_LIST_SELECT_FIELDS } from "../config";
import {
	canModifyMailbox,
	formatAllowedMailboxes,
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
	isError?: boolean;
}

/**
 * Arguments for list task lists handler
 */
interface ListTaskListsArgs {
	mailbox?: string;
}

/**
 * Arguments for create task list handler
 */
interface CreateTaskListArgs {
	mailbox?: string;
	displayName?: string;
}

/**
 * Task list structure from Graph API
 */
interface GraphTaskList {
	id: string;
	displayName: string;
	isOwner?: boolean;
	isShared?: boolean;
	wellknownListName?: string;
}

/**
 * Graph API response for task lists
 */
interface GraphTaskListsResponse {
	value: GraphTaskList[];
}

/**
 * List task lists handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleListTaskLists(
	args: ListTaskListsArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const response = await callGraphAPI<GraphTaskListsResponse>(
			accessToken,
			"GET",
			`users/${mailbox}/todo/lists`,
			null,
			{ $select: TASK_LIST_SELECT_FIELDS },
		);

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No task lists found.",
					},
				],
			};
		}

		const listDisplay = response.value
			.map((list, index) => {
				const owner = list.isOwner ? "Owner" : "Member";
				const shared = list.isShared ? " (Shared)" : "";
				const wellknown = list.wellknownListName
					? ` [${list.wellknownListName}]`
					: "";

				return `${index + 1}. ${list.displayName}${wellknown}${shared}\n   ${owner}\n   ID: ${list.id}`;
			})
			.join("\n\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${response.value.length} task lists:\n\n${listDisplay}`,
				},
			],
		};
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
					text: `Error listing task lists: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Create task list handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleCreateTaskList(
	args: CreateTaskListArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const displayName = args.displayName;
	if (!displayName) {
		return {
			content: [
				{
					type: "text",
					text: "Display name is required.",
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
					text: `Creating task lists is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const response = await callGraphAPI<GraphTaskList>(
			accessToken,
			"POST",
			`users/${mailbox}/todo/lists`,
			{ displayName },
		);

		return {
			content: [
				{
					type: "text",
					text: `Task list created successfully!\n\nName: ${response.displayName}\nID: ${response.id}`,
				},
			],
		};
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
					text: `Error creating task list: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}
