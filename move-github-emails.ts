#!/usr/bin/env bun
/**
 * Script to find and move existing GitHub notification emails
 * to the GitHub Notifications subfolder
 */
import path from "node:path";

interface TokenData {
	access_token: string;
}

interface Email {
	id: string;
	subject: string;
	from?: {
		emailAddress?: {
			address?: string;
		};
	};
	receivedDateTime?: string;
}

interface EmailsResponse {
	value: Email[];
}

const homePath = process.env.HOME || "/Users/ryaker";
const tokenPath = path.join(homePath, ".outlook-mcp-tokens.json");
const githubFolderId =
	"AAMkAGQ0NzYwMTdmLTYzMWUtNDE1ZS04ZDYyLTZjZmQ5YjkyNWM0OQAuAAAAAAAMiw_uRKMyQ4cvWGcmDNGZAQD-pkus0juzTK_ueB_BlgMCAAGKmpqoAAA=";
const notificationsFolderId =
	"AAMkAGQ0NzYwMTdmLTYzMWUtNDE1ZS04ZDYyLTZjZmQ5YjkyNWM0OQAuAAAAAAAMiw_uRKMyQ4cvWGcmDNGZAQD-pkus0juzTK_ueB_BlgMCAAGKmpqpAAA=";

/**
 * Helper function to read token data from file
 */
async function getTokenData(): Promise<TokenData> {
	return await Bun.file(tokenPath).json();
}

/**
 * Helper function to call Microsoft Graph API using native fetch
 */
async function callGraphAPI(
	endpoint: string,
	method = "GET",
	data: unknown = null,
): Promise<unknown> {
	const tokenData = await getTokenData();
	const accessToken = tokenData.access_token;

	const url = `https://graph.microsoft.com/v1.0/${endpoint}`;
	const options: RequestInit = {
		method,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	};

	if (data && (method === "POST" || method === "PATCH" || method === "PUT")) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`API request failed with status ${response.status}: ${errorText}`,
		);
	}

	const responseText = await response.text();
	return responseText ? JSON.parse(responseText) : {};
}

async function moveGitHubEmails(): Promise<void> {
	try {
		console.log(`Reading token from ${tokenPath}`);
		const tokenData = await getTokenData();
		const accessToken = tokenData.access_token;

		if (!accessToken) {
			console.error("No access token found in token file!");
			process.exit(1);
		}

		console.log("Successfully read access token");

		console.log("\nSearching for GitHub notification emails...");
		const searchParams = new URLSearchParams({
			$filter:
				"from/emailAddress/address eq 'notifications@github.com' or from/emailAddress/address eq 'noreply@github.com'",
			$top: "100",
			$select: "id,subject,from,receivedDateTime",
		});

		const inboxEmails = (await callGraphAPI(
			`me/mailFolders/inbox/messages?${searchParams.toString()}`,
		)) as EmailsResponse;

		console.log(
			`Found ${inboxEmails.value.length} GitHub notification emails in inbox`,
		);

		const workflowEmails: Email[] = [];
		const otherEmails: Email[] = [];

		for (const email of inboxEmails.value) {
			const subject = email.subject.toLowerCase();
			if (
				subject.includes("workflow") ||
				subject.includes("run failed") ||
				subject.includes("run completed") ||
				subject.includes("github actions")
			) {
				workflowEmails.push(email);
			} else if (subject.includes("[gondola")) {
				workflowEmails.push(email);
			} else {
				otherEmails.push(email);
			}
		}

		console.log(`Workflow notifications: ${workflowEmails.length}`);
		console.log(`Other GitHub emails: ${otherEmails.length}`);

		if (workflowEmails.length > 0) {
			console.log(
				"\nMoving workflow notifications to Notifications subfolder...",
			);

			let movedCount = 0;
			for (const email of workflowEmails) {
				try {
					await callGraphAPI(`me/messages/${email.id}/move`, "POST", {
						destinationId: notificationsFolderId,
					});
					movedCount++;
					console.log(
						`Moved ${movedCount}/${workflowEmails.length}: "${email.subject}"`,
					);
				} catch (error) {
					console.error(`Failed to move email: ${(error as Error).message}`);
				}
			}

			console.log(
				`Successfully moved ${movedCount} workflow notifications to Notifications subfolder`,
			);
		}

		if (otherEmails.length > 0) {
			console.log("\nMoving other GitHub emails to GitHub folder...");

			let movedCount = 0;
			for (const email of otherEmails) {
				try {
					await callGraphAPI(`me/messages/${email.id}/move`, "POST", {
						destinationId: githubFolderId,
					});
					movedCount++;
					console.log(
						`Moved ${movedCount}/${otherEmails.length}: "${email.subject}"`,
					);
				} catch (error) {
					console.error(`Failed to move email: ${(error as Error).message}`);
				}
			}

			console.log(
				`Successfully moved ${movedCount} other GitHub emails to GitHub folder`,
			);
		}

		console.log("\nEmail organization complete!");
	} catch (error) {
		console.error("Error:", error);
	}
}

moveGitHubEmails();
