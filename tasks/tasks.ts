/**
 * Task management functionality
 */

import { ensureAuthenticated } from "../auth";
import { DEFAULT_PAGE_SIZE, DEFAULT_TIMEZONE, MAX_RESULT_COUNT, TASK_SELECT_FIELDS } from "../config";
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
 * Arguments for list tasks handler
 */
interface ListTasksArgs {
	mailbox?: string;
	listId?: string;
	count?: number;
	status?: string;
}

/**
 * Arguments for get task handler
 */
interface GetTaskArgs {
	mailbox?: string;
	listId?: string;
	taskId?: string;
}

/**
 * Arguments for create task handler
 */
interface CreateTaskArgs {
	mailbox?: string;
	listId?: string;
	title?: string;
	body?: string;
	status?: string;
	importance?: string;
	dueDateTime?: string;
	isReminderOn?: boolean;
}

/**
 * Arguments for update task handler
 */
interface UpdateTaskArgs {
	mailbox?: string;
	listId?: string;
	taskId?: string;
	title?: string;
	body?: string;
	status?: string;
	importance?: string;
	dueDateTime?: string;
	isReminderOn?: boolean;
}

/**
 * Arguments for delete task handler
 */
interface DeleteTaskArgs {
	mailbox?: string;
	listId?: string;
	taskId?: string;
}

/**
 * Task date/time structure from Graph API
 */
interface TaskDateTime {
	dateTime: string;
	timeZone: string;
}

/**
 * Task structure from Graph API
 */
interface GraphTask {
	id: string;
	title: string;
	body?: { content: string; contentType: string };
	status?: string;
	importance?: string;
	isReminderOn?: boolean;
	dueDateTime?: TaskDateTime;
	createdDateTime?: string;
	lastModifiedDateTime?: string;
	completedDateTime?: TaskDateTime;
}

/**
 * Graph API response for tasks
 */
interface GraphTasksResponse {
	value: GraphTask[];
}

/**
 * Task body for Graph API create/update
 */
interface GraphTaskBody {
	title?: string;
	body?: { content: string; contentType: string };
	status?: string;
	importance?: string;
	dueDateTime?: TaskDateTime;
	isReminderOn?: boolean;
}

/**
 * List tasks handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleListTasks(
	args: ListTasksArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const listId = args.listId;
	if (!listId) {
		return {
			content: [
				{
					type: "text",
					text: "Task list ID is required.",
				},
			],
			isError: true,
		};
	}

	const requestedCount = Math.min(
		args.count ?? DEFAULT_PAGE_SIZE,
		MAX_RESULT_COUNT,
	);

	try {
		const accessToken = await ensureAuthenticated();

		const queryParams: Record<string, string | number | boolean | undefined> = {
			$select: TASK_SELECT_FIELDS,
			$top: requestedCount,
		};

		if (args.status) {
			queryParams.$filter = `status eq '${args.status}'`;
		}

		const response = await callGraphAPI<GraphTasksResponse>(
			accessToken,
			"GET",
			`users/${mailbox}/todo/lists/${listId}/tasks`,
			null,
			queryParams,
		);

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: args.status
							? `No tasks found with status "${args.status}".`
							: "No tasks found in this list.",
					},
				],
			};
		}

		const taskList = response.value
			.map((task, index) => {
				const status = task.status ?? "unknown";
				const importance = task.importance ?? "normal";
				const due = task.dueDateTime
					? `Due: ${task.dueDateTime.dateTime}`
					: "No due date";

				return `${index + 1}. [${status}] ${task.title}\n   Importance: ${importance} | ${due}\n   ID: ${task.id}`;
			})
			.join("\n\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${response.value.length} tasks:\n\n${taskList}`,
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
					text: `Error listing tasks: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Get task handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleGetTask(
	args: GetTaskArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const listId = args.listId;
	if (!listId) {
		return {
			content: [
				{
					type: "text",
					text: "Task list ID is required.",
				},
			],
			isError: true,
		};
	}

	const taskId = args.taskId;
	if (!taskId) {
		return {
			content: [
				{
					type: "text",
					text: "Task ID is required.",
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const task = await callGraphAPI<GraphTask>(
			accessToken,
			"GET",
			`users/${mailbox}/todo/lists/${listId}/tasks/${taskId}`,
			null,
			{ $select: TASK_SELECT_FIELDS },
		);

		const details = [
			`Title: ${task.title}`,
			`Status: ${task.status ?? "unknown"}`,
			`Importance: ${task.importance ?? "normal"}`,
			task.body?.content ? `Body: ${task.body.content}` : null,
			task.dueDateTime ? `Due: ${task.dueDateTime.dateTime}` : null,
			task.completedDateTime
				? `Completed: ${task.completedDateTime.dateTime}`
				: null,
			`Reminder: ${task.isReminderOn ? "On" : "Off"}`,
			task.createdDateTime ? `Created: ${task.createdDateTime}` : null,
			task.lastModifiedDateTime
				? `Last Modified: ${task.lastModifiedDateTime}`
				: null,
			`ID: ${task.id}`,
		]
			.filter(Boolean)
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Task Details:\n\n${details}`,
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
					text: `Error getting task: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Create task handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleCreateTask(
	args: CreateTaskArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const listId = args.listId;
	if (!listId) {
		return {
			content: [
				{
					type: "text",
					text: "Task list ID is required.",
				},
			],
			isError: true,
		};
	}

	const title = args.title;
	if (!title) {
		return {
			content: [
				{
					type: "text",
					text: "Task title is required.",
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
					text: `Creating tasks is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const body: GraphTaskBody = { title };

		if (args.body) {
			body.body = { content: args.body, contentType: "text" };
		}
		if (args.status) body.status = args.status;
		if (args.importance) body.importance = args.importance;
		if (args.isReminderOn !== undefined) {
			body.isReminderOn = args.isReminderOn;
		}
		if (args.dueDateTime) {
			body.dueDateTime = {
				dateTime: args.dueDateTime,
				timeZone: DEFAULT_TIMEZONE,
			};
		}

		const response = await callGraphAPI<GraphTask>(
			accessToken,
			"POST",
			`users/${mailbox}/todo/lists/${listId}/tasks`,
			body,
		);

		return {
			content: [
				{
					type: "text",
					text: `Task created successfully!\n\nTitle: ${response.title}\nID: ${response.id}`,
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
					text: `Error creating task: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Update task handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleUpdateTask(
	args: UpdateTaskArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const listId = args.listId;
	if (!listId) {
		return {
			content: [
				{
					type: "text",
					text: "Task list ID is required.",
				},
			],
			isError: true,
		};
	}

	const taskId = args.taskId;
	if (!taskId) {
		return {
			content: [
				{
					type: "text",
					text: "Task ID is required.",
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
					text: `Updating tasks is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const body: GraphTaskBody = {};

		if (args.title) body.title = args.title;
		if (args.body) {
			body.body = { content: args.body, contentType: "text" };
		}
		if (args.status) body.status = args.status;
		if (args.importance) body.importance = args.importance;
		if (args.isReminderOn !== undefined) {
			body.isReminderOn = args.isReminderOn;
		}
		if (args.dueDateTime) {
			body.dueDateTime = {
				dateTime: args.dueDateTime,
				timeZone: DEFAULT_TIMEZONE,
			};
		}

		const response = await callGraphAPI<GraphTask>(
			accessToken,
			"PATCH",
			`users/${mailbox}/todo/lists/${listId}/tasks/${taskId}`,
			body,
		);

		return {
			content: [
				{
					type: "text",
					text: `Task updated successfully!\n\nTitle: ${response.title}\nID: ${response.id}`,
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
					text: `Error updating task: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

/**
 * Delete task handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleDeleteTask(
	args: DeleteTaskArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const listId = args.listId;
	if (!listId) {
		return {
			content: [
				{
					type: "text",
					text: "Task list ID is required.",
				},
			],
			isError: true,
		};
	}

	const taskId = args.taskId;
	if (!taskId) {
		return {
			content: [
				{
					type: "text",
					text: "Task ID is required.",
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
					text: `Deleting tasks is not allowed for this mailbox. Allowed: ${formatAllowedMailboxes()}`,
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		await callGraphAPI(
			accessToken,
			"DELETE",
			`users/${mailbox}/todo/lists/${listId}/tasks/${taskId}`,
		);

		return {
			content: [
				{
					type: "text",
					text: "Task deleted successfully.",
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
					text: `Error deleting task: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}
