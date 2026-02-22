/**
 * Contacts module for Outlook MCP server
 */

import { handleCreateContact } from "./create";
import { handleDeleteContact } from "./delete";
import { handleGetContact } from "./get";
import { handleListContacts } from "./list";
import { handleUpdateContact } from "./update";

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

// Contacts tool definitions
export const contactsTools: ToolDefinition[] = [
	{
		name: "list-contacts",
		description: "Lists contacts from a mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				search: {
					type: "string",
					description:
						"Search query to filter contacts by name or email address",
				},
				count: {
					type: "number",
					description:
						"Number of contacts to retrieve (default: 25, max: 50)",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleListContacts as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "get-contact",
		description: "Gets the full details of a specific contact",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				contactId: {
					type: "string",
					description: "ID of the contact to retrieve",
				},
			},
			required: ["mailbox", "contactId"],
			additionalProperties: false,
		},
		handler: handleGetContact as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "create-contact",
		description: "Creates a new contact in the mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				givenName: {
					type: "string",
					description: "First name of the contact",
				},
				surname: {
					type: "string",
					description: "Last name of the contact",
				},
				emailAddresses: {
					type: "string",
					description:
						"Comma-separated list of email addresses",
				},
				businessPhones: {
					type: "string",
					description: "Comma-separated list of business phone numbers",
				},
				mobilePhone: {
					type: "string",
					description: "Mobile phone number",
				},
				companyName: {
					type: "string",
					description: "Company name",
				},
				jobTitle: {
					type: "string",
					description: "Job title",
				},
				department: {
					type: "string",
					description: "Department",
				},
			},
			required: ["mailbox"],
			additionalProperties: false,
		},
		handler: handleCreateContact as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "update-contact",
		description: "Updates an existing contact in the mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				contactId: {
					type: "string",
					description: "ID of the contact to update",
				},
				givenName: {
					type: "string",
					description: "First name of the contact",
				},
				surname: {
					type: "string",
					description: "Last name of the contact",
				},
				emailAddresses: {
					type: "string",
					description:
						"Comma-separated list of email addresses",
				},
				businessPhones: {
					type: "string",
					description: "Comma-separated list of business phone numbers",
				},
				mobilePhone: {
					type: "string",
					description: "Mobile phone number",
				},
				companyName: {
					type: "string",
					description: "Company name",
				},
				jobTitle: {
					type: "string",
					description: "Job title",
				},
				department: {
					type: "string",
					description: "Department",
				},
			},
			required: ["mailbox", "contactId"],
			additionalProperties: false,
		},
		handler: handleUpdateContact as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
	{
		name: "delete-contact",
		description: "Deletes a contact from the mailbox",
		inputSchema: {
			type: "object",
			properties: {
				mailbox: {
					type: "string",
					description:
						"Mailbox email address to operate on (e.g., 'chi@desertservices.net')",
				},
				contactId: {
					type: "string",
					description: "ID of the contact to delete",
				},
			},
			required: ["mailbox", "contactId"],
			additionalProperties: false,
		},
		handler: handleDeleteContact as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export {
	handleListContacts,
	handleGetContact,
	handleCreateContact,
	handleUpdateContact,
	handleDeleteContact,
};
