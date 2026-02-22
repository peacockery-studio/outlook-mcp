/**
 * Tasks module for Outlook MCP server
 */

import { handleCreateTaskList, handleListTaskLists } from "./lists";
import {
	handleCreateTask,
	handleDeleteTask,
	handleGetTask,
	handleListTasks,
	handleUpdateTask,
} from "./tasks";

interface MCPResponse {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

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
				enum?: string[];
				items?: { type: string };
			}
		>;
		required: string[];
		additionalProperties?: boolean;
	};
	handler: (args: Record<string, unknown>) => Promise<MCPResponse>;
}

// Tasks tool definitions
export const tasksTools: ToolDefinition[] = [
	{
		name: "list-task-lists",
		description: "Lists all To Do task lists in the mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleListTaskLists as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-task-list",
		description: "Creates a new To Do task list",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				displayName: {
					type: "string",
					description: "Name for the new task list",
				},
			},
			required: ["mailbox", "displayName"],
			additionalProperties: false,
		},
		handler: handleCreateTaskList as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "list-tasks",
		description: "Lists tasks from a specific To Do task list",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				listId: {
					type: "string",
					description: "ID of the task list to retrieve tasks from",
				},
				count: {
					type: "number",
					description:
						"Number of tasks to retrieve (default: 25, max: 50)",
				},
				status: {
					type: "string",
					description: "Filter tasks by status",
					enum: [
						"notStarted",
						"inProgress",
						"completed",
						"waitingOnOthers",
						"deferred",
					],
				},
			},
			required: ["mailbox", "listId"],
			additionalProperties: false,
		},
		handler: handleListTasks as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-task",
		description: "Gets the full details of a specific task",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				listId: {
					type: "string",
					description: "ID of the task list containing the task",
				},
				taskId: {
					type: "string",
					description: "ID of the task to retrieve",
				},
			},
			required: ["mailbox", "listId", "taskId"],
			additionalProperties: false,
		},
		handler: handleGetTask as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-task",
		description: "Creates a new task in a To Do task list",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				listId: {
					type: "string",
					description: "ID of the task list to create the task in",
				},
				title: {
					type: "string",
					description: "Title of the task",
				},
				body: {
					type: "string",
					description: "Optional body/description of the task",
				},
				status: {
					type: "string",
					description: "Task status",
					enum: [
						"notStarted",
						"inProgress",
						"completed",
						"waitingOnOthers",
						"deferred",
					],
				},
				importance: {
					type: "string",
					description: "Task importance level",
					enum: ["low", "normal", "high"],
				},
				dueDateTime: {
					type: "string",
					description:
						"Due date/time in ISO 8601 format (e.g., '2026-03-01T09:00:00')",
				},
				isReminderOn: {
					type: "boolean",
					description: "Whether to enable a reminder for the task",
				},
			},
			required: ["mailbox", "listId", "title"],
			additionalProperties: false,
		},
		handler: handleCreateTask as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "update-task",
		description: "Updates an existing task in a To Do task list",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				listId: {
					type: "string",
					description: "ID of the task list containing the task",
				},
				taskId: {
					type: "string",
					description: "ID of the task to update",
				},
				title: {
					type: "string",
					description: "New title for the task",
				},
				body: {
					type: "string",
					description: "New body/description for the task",
				},
				status: {
					type: "string",
					description: "New task status",
					enum: [
						"notStarted",
						"inProgress",
						"completed",
						"waitingOnOthers",
						"deferred",
					],
				},
				importance: {
					type: "string",
					description: "New task importance level",
					enum: ["low", "normal", "high"],
				},
				dueDateTime: {
					type: "string",
					description:
						"New due date/time in ISO 8601 format (e.g., '2026-03-01T09:00:00')",
				},
				isReminderOn: {
					type: "boolean",
					description: "Whether to enable a reminder for the task",
				},
			},
			required: ["mailbox", "listId", "taskId"],
			additionalProperties: false,
		},
		handler: handleUpdateTask as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "delete-task",
		description: "Deletes a task from a To Do task list",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				listId: {
					type: "string",
					description: "ID of the task list containing the task",
				},
				taskId: {
					type: "string",
					description: "ID of the task to delete",
				},
			},
			required: ["mailbox", "listId", "taskId"],
			additionalProperties: false,
		},
		handler: handleDeleteTask as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export {
	handleListTaskLists,
	handleCreateTaskList,
	handleListTasks,
	handleGetTask,
	handleCreateTask,
	handleUpdateTask,
	handleDeleteTask,
};
