/**
 * Send email functionality
 */

import { ensureAuthenticated } from "../auth";
import {
	canSendFrom,
	formatAllowedMailboxes,
	getCurrentUserEmail,
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
}

/**
 * Arguments for send email handler
 */
interface SendEmailArgs {
	to?: string;
	cc?: string;
	bcc?: string;
	subject?: string;
	body?: string;
	importance?: "normal" | "high" | "low";
	saveToSentItems?: boolean;
}

/**
 * Email recipient structure for Graph API
 */
interface GraphRecipient {
	emailAddress: {
		address: string;
	};
}

/**
 * Email object structure for Graph API
 */
interface GraphEmailObject {
	message: {
		subject: string;
		body: {
			contentType: "html" | "text";
			content: string;
		};
		toRecipients: GraphRecipient[];
		ccRecipients?: GraphRecipient[];
		bccRecipients?: GraphRecipient[];
		importance: string;
	};
	saveToSentItems: boolean;
}

/**
 * Send email handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleSendEmail(
	args: SendEmailArgs,
): Promise<MCPResponse> {
	const {
		to,
		cc,
		bcc,
		subject,
		body,
		importance = "normal",
		saveToSentItems = true,
	} = args;

	// Validate required parameters
	if (!to) {
		return {
			content: [
				{
					type: "text",
					text: "Recipient (to) is required.",
				},
			],
		};
	}

	if (!subject) {
		return {
			content: [
				{
					type: "text",
					text: "Subject is required.",
				},
			],
		};
	}

	if (!body) {
		return {
			content: [
				{
					type: "text",
					text: "Body content is required.",
				},
			],
		};
	}

	try {
		// Get access token
		const accessToken = await ensureAuthenticated();

		// Check if the current mailbox has permission to send
		const currentUserEmail = await getCurrentUserEmail(accessToken);
		if (!canSendFrom(currentUserEmail)) {
			return {
				content: [
					{
						type: "text",
						text: `Sending is not allowed from this mailbox. Allowed: ${formatAllowedMailboxes()}`,
					},
				],
			};
		}

		// Format recipients
		const toRecipients: GraphRecipient[] = to.split(",").map((email) => {
			const trimmedEmail = email.trim();
			return {
				emailAddress: {
					address: trimmedEmail,
				},
			};
		});

		const ccRecipients: GraphRecipient[] = cc
			? cc.split(",").map((email) => {
					const trimmedEmail = email.trim();
					return {
						emailAddress: {
							address: trimmedEmail,
						},
					};
				})
			: [];

		const bccRecipients: GraphRecipient[] = bcc
			? bcc.split(",").map((email) => {
					const trimmedEmail = email.trim();
					return {
						emailAddress: {
							address: trimmedEmail,
						},
					};
				})
			: [];

		// Prepare email object
		const emailObject: GraphEmailObject = {
			message: {
				subject,
				body: {
					contentType: body.includes("<html") ? "html" : "text",
					content: body,
				},
				toRecipients,
				ccRecipients: ccRecipients.length > 0 ? ccRecipients : undefined,
				bccRecipients: bccRecipients.length > 0 ? bccRecipients : undefined,
				importance,
			},
			saveToSentItems,
		};

		// Make API call to send email
		await callGraphAPI(accessToken, "POST", "me/sendMail", emailObject);

		return {
			content: [
				{
					type: "text",
					text: `Email sent successfully!\n\nSubject: ${subject}\nRecipients: ${toRecipients.length}${ccRecipients.length > 0 ? ` + ${ccRecipients.length} CC` : ""}${bccRecipients.length > 0 ? ` + ${bccRecipients.length} BCC` : ""}\nMessage Length: ${body.length} characters`,
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
					text: `Error sending email: ${errorMessage}`,
				},
			],
		};
	}
}

export default handleSendEmail;
