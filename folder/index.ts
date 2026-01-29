/**
 * Folder management module for Outlook MCP server
 */

import type { MCPResponse, ToolDefinition } from "../auth/tools.js";
import handleCreateFolder from "./create.js";
import handleListFolders from "./list.js";
import handleMoveEmails from "./move.js";

export const folderTools: ToolDefinition[] = [
	{
		name: "list-folders",
		description: "Lists mail folders in your Outlook account",
		inputSchema: {
			type: "object",
			properties: {
				includeItemCounts: {
					type: "boolean",
					description: "Include counts of total and unread items",
				},
				includeChildren: {
					type: "boolean",
					description: "Include child folders in hierarchy",
				},
			},
			required: [],
		},
		handler: handleListFolders as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-folder",
		description: "Creates a new mail folder",
		inputSchema: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Name of the folder to create",
				},
				parentFolder: {
					type: "string",
					description: "Optional parent folder name (default is root)",
				},
			},
			required: ["name"],
		},
		handler: handleCreateFolder as unknown as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "move-emails",
		description: "Moves emails from one folder to another",
		inputSchema: {
			type: "object",
			properties: {
				emailIds: {
					type: "string",
					description: "Comma-separated list of email IDs to move",
				},
				targetFolder: {
					type: "string",
					description: "Name of the folder to move emails to",
				},
				sourceFolder: {
					type: "string",
					description: "Optional name of the source folder (default is inbox)",
				},
			},
			required: ["emailIds", "targetFolder"],
		},
		handler: handleMoveEmails as unknown as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export { handleListFolders, handleCreateFolder, handleMoveEmails };
