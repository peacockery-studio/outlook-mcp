/**
 * Read email functionality
 */

import { ensureAuthenticated } from "../auth";
import config from "../config";
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
 * Arguments for read email handler
 */
interface ReadEmailArgs {
	id?: string;
	mailbox?: string;
}

/**
 * Email address structure from Graph API
 */
interface EmailAddress {
	name: string;
	address: string;
}

/**
 * Email recipient structure from Graph API
 */
interface EmailRecipient {
	emailAddress: EmailAddress;
}

/**
 * Email body structure from Graph API
 */
interface EmailBody {
	contentType: "html" | "text";
	content: string;
}

/**
 * Full email structure from Graph API
 */
interface GraphEmailDetail {
	id: string;
	subject: string;
	from?: { emailAddress: EmailAddress };
	toRecipients?: EmailRecipient[];
	ccRecipients?: EmailRecipient[];
	bccRecipients?: EmailRecipient[];
	receivedDateTime: string;
	bodyPreview?: string;
	body?: EmailBody;
	hasAttachments: boolean;
	importance?: string;
	isRead: boolean;
}

/**
 * Read email handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleReadEmail(
	args: ReadEmailArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailId = args.id;

	if (!emailId) {
		return {
			content: [
				{
					type: "text",
					text: "Email ID is required.",
				},
			],
			isError: true,
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Make API call to get email details
		// graph-api.ts handles path segment encoding — do NOT pre-encode emailId
		const endpoint = `users/${mailbox}/messages/${emailId}`;
		const queryParams = {
			$select: config.EMAIL_DETAIL_FIELDS,
		};

		try {
			const email = (await callGraphAPI(
				accessToken,
				"GET",
				endpoint,
				null,
				queryParams,
			)) as GraphEmailDetail | null;

			if (!email) {
				return {
					content: [
						{
							type: "text",
							text: `Email with ID ${emailId} not found.`,
						},
					],
				};
			}

			// Format sender, recipients, etc.
			const sender = email.from
				? `${email.from.emailAddress.name} (${email.from.emailAddress.address})`
				: "Unknown";
			const to = email.toRecipients
				? email.toRecipients
						.map((r) => `${r.emailAddress.name} (${r.emailAddress.address})`)
						.join(", ")
				: "None";
			const cc =
				email.ccRecipients && email.ccRecipients.length > 0
					? email.ccRecipients
							.map((r) => `${r.emailAddress.name} (${r.emailAddress.address})`)
							.join(", ")
					: "None";
			const bcc =
				email.bccRecipients && email.bccRecipients.length > 0
					? email.bccRecipients
							.map((r) => `${r.emailAddress.name} (${r.emailAddress.address})`)
							.join(", ")
					: "None";
			const date = new Date(email.receivedDateTime).toLocaleString();

			// Extract body content
			let body = "";
			if (email.body) {
				body =
					email.body.contentType === "html"
						? // Simple HTML-to-text conversion for HTML bodies
							email.body.content.replace(/<[^>]*>/g, "")
						: email.body.content;
			} else {
				body = email.bodyPreview ?? "No content";
			}

			// Format the email
			const formattedEmail = `From: ${sender}
To: ${to}
${cc !== "None" ? `CC: ${cc}\n` : ""}${bcc !== "None" ? `BCC: ${bcc}\n` : ""}Subject: ${email.subject}
Date: ${date}
Importance: ${email.importance ?? "normal"}
Has Attachments: ${email.hasAttachments ? "Yes" : "No"}

${body}`;

			return {
				content: [
					{
						type: "text",
						text: formattedEmail,
					},
				],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(`Error reading email: ${errorMessage}`);

			// Improved error handling with more specific messages
			if (errorMessage.includes("doesn't belong to the targeted mailbox")) {
				return {
					content: [
						{
							type: "text",
							text: "The email ID seems invalid or doesn't belong to your mailbox. Please try with a different email ID.",
						},
					],
					isError: true,
				};
			}
			return {
				content: [
					{
						type: "text",
						text: `Failed to read email: ${errorMessage}`,
					},
				],
				isError: true,
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
				isError: true,
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Error accessing email: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleReadEmail;
