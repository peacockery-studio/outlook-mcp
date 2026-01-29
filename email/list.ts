/**
 * List emails functionality
 */

import { ensureAuthenticated } from "../auth";
import config from "../config";
import { callGraphAPIPaginated } from "../utils/graph-api";
import { resolveFolderPath } from "./folder-utils";

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
 * Arguments for list emails handler
 */
interface ListEmailsArgs {
	folder?: string;
	count?: number;
}

/**
 * Email address structure from Graph API
 */
interface EmailAddress {
	name: string;
	address: string;
}

/**
 * Email from structure from Graph API
 */
interface EmailFrom {
	emailAddress: EmailAddress;
}

/**
 * Email structure from Graph API
 */
interface GraphEmail {
	id: string;
	subject: string;
	from?: EmailFrom;
	receivedDateTime: string;
	isRead: boolean;
}

/**
 * Graph API paginated response
 */
interface GraphPaginatedResponse {
	value: GraphEmail[];
	"@odata.count"?: number;
}

/**
 * List emails handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleListEmails(
	args: ListEmailsArgs,
): Promise<MCPResponse> {
	const folder = args.folder ?? "inbox";
	const requestedCount = args.count ?? 10;

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Resolve the folder path
		const endpoint = await resolveFolderPath(accessToken, folder);

		// Add query parameters
		const queryParams = {
			$top: Math.min(50, requestedCount), // Use 50 per page for efficiency
			$orderby: "receivedDateTime desc",
			$select: config.EMAIL_SELECT_FIELDS,
		};

		// Make API call with pagination support
		const response = (await callGraphAPIPaginated(
			accessToken,
			"GET",
			endpoint,
			queryParams,
			requestedCount,
		)) as GraphPaginatedResponse;

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: `No emails found in ${folder}.`,
					},
				],
			};
		}

		// Format results
		const emailList = response.value
			.map((email, index) => {
				const sender = email.from
					? email.from.emailAddress
					: { name: "Unknown", address: "unknown" };
				const date = new Date(email.receivedDateTime).toLocaleString();
				const readStatus = email.isRead ? "" : "[UNREAD] ";

				return `${index + 1}. ${readStatus}${date} - From: ${sender.name} (${sender.address})\nSubject: ${email.subject}\nID: ${email.id}\n`;
			})
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${response.value.length} emails in ${folder}:\n\n${emailList}`,
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
					text: `Error listing emails: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleListEmails;
