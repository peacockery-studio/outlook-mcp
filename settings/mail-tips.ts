/**
 * Get mail tips functionality
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
	isError?: boolean;
}

/**
 * Arguments for get mail tips handler
 */
interface GetMailTipsArgs {
	mailbox?: string;
	emailAddresses?: string;
}

/**
 * Automatic replies mail tip from Graph API
 */
interface AutomaticRepliesMailTips {
	message?: string;
	messageLanguage?: { locale: string };
	scheduledStartTime?: { dateTime: string; timeZone: string };
	scheduledEndTime?: { dateTime: string; timeZone: string };
}

/**
 * Mail tip from Graph API
 */
interface GraphMailTip {
	emailAddress?: { address: string; name?: string };
	automaticReplies?: AutomaticRepliesMailTips;
	mailboxFull?: boolean;
	customMailTip?: string;
	deliveryRestricted?: boolean;
	isModerated?: boolean;
	recipientScope?: string;
	totalMemberCount?: number;
	maxMessageSize?: number;
}

/**
 * Graph API response for mail tips
 */
interface GraphMailTipsResponse {
	value: GraphMailTip[];
}

/**
 * Mail tips request body for Graph API
 */
interface MailTipsRequestBody {
	EmailAddresses: string[];
	MailTipsOptions: string;
}

/**
 * Get mail tips handler
 * @param args - Tool arguments
 * @returns MCP response
 */
export async function handleGetMailTips(
	args: GetMailTipsArgs,
): Promise<MCPResponse> {
	const mailbox = args.mailbox;
	if (!mailbox) {
		return {
			content: [{ type: "text", text: "Mailbox address is required." }],
			isError: true,
		};
	}

	const emailAddresses = args.emailAddresses;
	if (!emailAddresses) {
		return {
			content: [
				{
					type: "text",
					text: "Email addresses are required (comma-separated).",
				},
			],
			isError: true,
		};
	}

	try {
		const accessToken = await ensureAuthenticated();

		const addresses = emailAddresses
			.split(",")
			.map((addr) => addr.trim());

		const body: MailTipsRequestBody = {
			EmailAddresses: addresses,
			MailTipsOptions:
				"automaticReplies,mailboxFullStatus,customMailTip,deliveryRestriction,moderationStatus,recipientScope,totalMemberCount",
		};

		const response = await callGraphAPI<GraphMailTipsResponse>(
			accessToken,
			"POST",
			`users/${mailbox}/getMailTips`,
			body,
		);

		if (!response.value || response.value.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No mail tips returned.",
					},
				],
			};
		}

		const tipsList = response.value
			.map((tip) => {
				const addr = tip.emailAddress?.address ?? "Unknown";
				const lines: string[] = [`Address: ${addr}`];

				if (tip.mailboxFull) {
					lines.push("  Mailbox Full: Yes");
				}
				if (tip.customMailTip) {
					lines.push(`  Custom Tip: ${tip.customMailTip}`);
				}
				if (tip.deliveryRestricted) {
					lines.push("  Delivery Restricted: Yes");
				}
				if (tip.isModerated) {
					lines.push("  Moderated: Yes");
				}
				if (tip.recipientScope) {
					lines.push(`  Recipient Scope: ${tip.recipientScope}`);
				}
				if (tip.totalMemberCount !== undefined) {
					lines.push(`  Total Members: ${tip.totalMemberCount}`);
				}
				if (tip.automaticReplies?.message) {
					const msg = tip.automaticReplies.message;
					lines.push(
						`  Auto-Reply: ${msg.substring(0, 300)}${msg.length > 300 ? "..." : ""}`,
					);
				}

				return lines.join("\n");
			})
			.join("\n\n");

		return {
			content: [
				{
					type: "text",
					text: `Mail Tips for ${response.value.length} address(es):\n\n${tipsList}`,
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
					text: `Error getting mail tips: ${errorMessage}`,
				},
			],
			isError: true,
		};
	}
}

export default handleGetMailTips;
