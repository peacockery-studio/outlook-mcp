#!/usr/bin/env bun
/**
 * Script to create a custom rule for GitHub notifications
 * using direct folder IDs
 */
import path from "node:path";

interface TokenData {
	access_token: string;
}

interface GraphAPIResponse {
	displayName?: string;
	id?: string;
	sequence?: number;
	isEnabled?: boolean;
}

interface RuleDefinition {
	displayName: string;
	sequence: number;
	isEnabled: boolean;
	conditions: {
		fromAddresses?: Array<{ emailAddress: { address: string } }>;
		subjectContains?: string[];
	};
	actions: {
		moveToFolder: string;
		stopProcessingRules: boolean;
	};
}

const homePath = process.env.HOME || "/Users/ryaker";
const tokenPath = path.join(homePath, ".outlook-mcp-tokens.json");
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

async function createGitHubRule(): Promise<void> {
	try {
		console.log(`Reading token from ${tokenPath}`);
		const tokenData = await getTokenData();
		const accessToken = tokenData.access_token;

		if (!accessToken) {
			console.error("No access token found in token file!");
			process.exit(1);
		}

		console.log("Successfully read access token");

		const rule: RuleDefinition = {
			displayName: "GitHub Workflow Notifications to Subfolder",
			sequence: 1,
			isEnabled: true,
			conditions: {
				fromAddresses: [
					{
						emailAddress: {
							address: "notifications@github.com",
						},
					},
					{
						emailAddress: {
							address: "noreply@github.com",
						},
					},
				],
				subjectContains: [
					"workflow",
					"Run failed",
					"Run completed",
					"GitHub Actions",
				],
			},
			actions: {
				moveToFolder: notificationsFolderId,
				stopProcessingRules: true,
			},
		};

		console.log("Creating GitHub notifications rule...");
		const response = (await callGraphAPI(
			"me/mailFolders/inbox/messageRules",
			"POST",
			rule,
		)) as GraphAPIResponse;

		console.log("\nRule created successfully:");
		console.log(`Name: ${response.displayName}`);
		console.log(`ID: ${response.id}`);
		console.log(`Sequence: ${response.sequence}`);
		console.log(`Enabled: ${response.isEnabled}`);

		const repoRule: RuleDefinition = {
			displayName: "GitHub Repository Notifications to Subfolder",
			sequence: 2,
			isEnabled: true,
			conditions: {
				fromAddresses: [
					{
						emailAddress: {
							address: "notifications@github.com",
						},
					},
				],
				subjectContains: ["[Gondola"],
			},
			actions: {
				moveToFolder: notificationsFolderId,
				stopProcessingRules: true,
			},
		};

		console.log("\nCreating GitHub repository notifications rule...");
		const repoResponse = (await callGraphAPI(
			"me/mailFolders/inbox/messageRules",
			"POST",
			repoRule,
		)) as GraphAPIResponse;

		console.log("\nRepository rule created successfully:");
		console.log(`Name: ${repoResponse.displayName}`);
		console.log(`ID: ${repoResponse.id}`);
		console.log(`Sequence: ${repoResponse.sequence}`);
		console.log(`Enabled: ${repoResponse.isEnabled}`);

		console.log(
			"\nRules created successfully! Your GitHub notifications will now be moved to the Notifications subfolder.",
		);
	} catch (error) {
		console.error("Error:", error);
	}
}

createGitHubRule();
