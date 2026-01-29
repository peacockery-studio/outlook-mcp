#!/usr/bin/env bun
/**
 * Script to find folder IDs for GitHub and Notifications folders
 * This helps create rules that target specific folders
 */
import path from "node:path";

interface TokenData {
	access_token: string;
}

interface MailFolder {
	id: string;
	displayName: string;
}

interface FoldersResponse {
	value: MailFolder[];
}

const homePath = process.env.HOME || "/Users/ryaker";
const tokenPath = path.join(homePath, ".outlook-mcp-tokens.json");

/**
 * Helper function to read token data from file
 */
async function getTokenData(): Promise<TokenData> {
	return await Bun.file(tokenPath).json();
}

/**
 * Helper function to call Microsoft Graph API using native fetch
 */
async function callGraphAPI(endpoint: string): Promise<unknown> {
	const tokenData = await getTokenData();
	const accessToken = tokenData.access_token;

	const url = `https://graph.microsoft.com/v1.0/${endpoint}`;
	const response = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`API request failed with status ${response.status}: ${errorText}`,
		);
	}

	const responseText = await response.text();
	return responseText ? JSON.parse(responseText) : {};
}

async function findFolderIds(): Promise<void> {
	try {
		console.log(`Reading token from ${tokenPath}`);
		const tokenData = await getTokenData();
		const accessToken = tokenData.access_token;

		if (!accessToken) {
			console.error("No access token found in token file!");
			process.exit(1);
		}

		console.log("Successfully read access token");

		console.log("\nFetching top-level folders...");
		const folders = (await callGraphAPI(
			"me/mailFolders?$top=100",
		)) as FoldersResponse;

		console.log("\nAll top-level folders:");
		for (const folder of folders.value) {
			console.log(`${folder.displayName}: ${folder.id}`);
		}

		const githubFolder = folders.value.find(
			(f) =>
				f.displayName === "GitHub" || f.displayName.toLowerCase() === "github",
		);

		if (!githubFolder) {
			console.error("\nGitHub folder not found!");
			process.exit(1);
		}

		console.log(`\nFound GitHub folder: ${githubFolder.displayName}`);
		console.log(`ID: ${githubFolder.id}`);

		console.log("\nFetching GitHub child folders...");
		const childFolders = (await callGraphAPI(
			`me/mailFolders/${githubFolder.id}/childFolders`,
		)) as FoldersResponse;

		console.log("\nChild folders of GitHub:");
		if (childFolders.value?.length > 0) {
			for (const folder of childFolders.value) {
				console.log(`${folder.displayName}: ${folder.id}`);
			}

			const notificationsFolder = childFolders.value.find(
				(f) =>
					f.displayName === "Notifications" ||
					f.displayName.toLowerCase() === "notifications",
			);

			if (notificationsFolder) {
				console.log(
					`\nFound Notifications subfolder: ${notificationsFolder.displayName}`,
				);
				console.log(`ID: ${notificationsFolder.id}`);

				console.log("\n===== FOLDER IDs FOR RULES =====");
				console.log(`GitHub folder: ${githubFolder.id}`);
				console.log(`Notifications subfolder: ${notificationsFolder.id}`);
				console.log("===============================");
			} else {
				console.log("\nNotifications subfolder not found in GitHub folder");
			}
		} else {
			console.log("No child folders found in GitHub folder");
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

findFolderIds();
