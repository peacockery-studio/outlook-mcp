/**
 * Email categories functionality
 *
 * Provides tools for managing Outlook categories (color-coded labels) on emails.
 */

import { ensureAuthenticated } from "../auth";
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
 * Category from Microsoft Graph API
 */
interface OutlookCategory {
	displayName: string;
	color: string;
}

/**
 * Graph API response for master categories
 */
interface MasterCategoriesResponse {
	value?: Array<{
		displayName: string;
		color?: string;
	}>;
}

/**
 * Arguments for get master categories handler (no arguments required)
 */
type GetMasterCategoriesArgs = Record<string, unknown>;

/**
 * Arguments for set email categories handler
 */
interface SetEmailCategoriesArgs {
	id?: string;
	categories?: string[];
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
				items?: { type: string };
			}
		>;
		required: string[];
	};
	handler: (args: Record<string, unknown>) => Promise<MCPResponse>;
}

/**
 * Get master categories handler
 *
 * Retrieves the list of available categories (color-coded labels) for the mailbox.
 * These are the categories that can be applied to emails.
 *
 * @param _args - Tool arguments (none required)
 * @returns MCP response with list of categories
 */
export async function handleGetMasterCategories(
	_args: GetMasterCategoriesArgs,
): Promise<MCPResponse> {
	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Make API call to get master categories
		const endpoint = "me/outlook/masterCategories";

		const response = (await callGraphAPI(
			accessToken,
			"GET",
			endpoint,
			null,
		)) as MasterCategoriesResponse;

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No categories found in your mailbox.",
					},
				],
			};
		}

		// Format categories
		const categories: OutlookCategory[] = response.value.map((cat) => ({
			displayName: cat.displayName,
			color: cat.color ?? "none",
		}));

		const categoryList = categories
			.map((cat, index) => `${index + 1}. ${cat.displayName} (${cat.color})`)
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${categories.length} categories in your mailbox:\n\n${categoryList}`,
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
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error getting categories: ${errorMessage}`,
				},
			],
		};
	}
}

/**
 * Set email categories handler
 *
 * Sets categories (color-coded labels) on an email. This replaces all existing
 * categories on the message with the provided list. Categories must exist in
 * the user's master categories list in Outlook.
 *
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleSetEmailCategories(
	args: SetEmailCategoriesArgs,
): Promise<MCPResponse> {
	const emailId = args.id;
	const categories = args.categories ?? [];

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
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Make API call to update email categories
		const endpoint = `me/messages/${encodeURIComponent(emailId)}`;
		const updateData = {
			categories: categories,
		};

		try {
			await callGraphAPI(accessToken, "PATCH", endpoint, updateData);

			const categoryText =
				categories.length > 0
					? `categories: ${categories.join(", ")}`
					: "no categories (all removed)";

			return {
				content: [
					{
						type: "text",
						text: `Email categories updated successfully.\n\nApplied ${categoryText}`,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(`Error setting email categories: ${errorMessage}`);

			// Improved error handling with more specific messages
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
			if (
				errorMessage.includes("InvalidArgument") ||
				errorMessage.includes("category")
			) {
				return {
					content: [
						{
							type: "text",
							text: `One or more categories may not exist in your mailbox. Please use 'get-master-categories' to see available categories.\n\nError: ${errorMessage}`,
						},
					],
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to set email categories: ${errorMessage}`,
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
 * Categories tool definitions
 */
export const categoriesTools: ToolDefinition[] = [
	{
		name: "get-master-categories",
		description:
			"Gets the list of available categories (color-coded labels) for your mailbox. Use this to see what categories can be applied to emails.",
		inputSchema: {
			type: "object",
			properties: {},
			required: [],
		},
		handler: handleGetMasterCategories,
	},
	{
		name: "set-email-categories",
		description:
			"Sets categories (color-coded labels) on a specific email. This replaces all existing categories on the email with the provided list. Categories must exist in your mailbox (use get-master-categories to see available options).",
		inputSchema: {
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "ID of the email to set categories on",
				},
				categories: {
					type: "array",
					description:
						"Array of category names to apply (e.g., ['Signed Contract', 'Needs Action']). Pass an empty array to remove all categories.",
					items: { type: "string" },
				},
			},
			required: ["id"],
		},
		handler: handleSetEmailCategories as (
			args: Record<string, unknown>,
		) => Promise<MCPResponse>,
	},
];

export default categoriesTools;
