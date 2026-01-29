/**
 * Token management for Microsoft Graph API authentication
 */
import config from "../config.js";

export interface TokenData {
	access_token: string;
	refresh_token?: string;
	expires_at?: number;
}

let cachedTokens: TokenData | null = null;

/**
 * Loads authentication tokens from the token file
 */
export async function loadTokenCache(): Promise<TokenData | null> {
	try {
		const tokenPath = config.AUTH_CONFIG.tokenStorePath;
		console.error(`[DEBUG] Attempting to load tokens from: ${tokenPath}`);
		console.error(`[DEBUG] HOME directory: ${process.env.HOME}`);
		console.error(`[DEBUG] Full resolved path: ${tokenPath}`);

		const file = Bun.file(tokenPath);
		if (!(await file.exists())) {
			console.error("[DEBUG] Token file does not exist");
			return null;
		}

		const stats = await file.stat();
		console.error(`[DEBUG] Token file stats:
      Size: ${file.size} bytes
      Created: ${stats?.birthtime}
      Modified: ${stats?.mtime}`);

		const tokenData = await file.text();
		console.error("[DEBUG] Token file contents length:", tokenData.length);
		console.error(
			"[DEBUG] Token file first 200 characters:",
			tokenData.slice(0, 200),
		);

		try {
			const tokens = JSON.parse(tokenData) as TokenData;
			console.error("[DEBUG] Parsed tokens keys:", Object.keys(tokens));

			for (const key of Object.keys(tokens)) {
				console.error(
					`[DEBUG] ${key}: ${typeof tokens[key as keyof TokenData]}`,
				);
			}

			if (!tokens.access_token) {
				console.error("[DEBUG] No access_token found in tokens");
				return null;
			}

			const now = Date.now();
			const expiresAt = tokens.expires_at || 0;

			console.error(`[DEBUG] Current time: ${now}`);
			console.error(`[DEBUG] Token expires at: ${expiresAt}`);

			if (now > expiresAt) {
				console.error("[DEBUG] Token has expired");
				return null;
			}

			cachedTokens = tokens;
			return tokens;
		} catch (parseError) {
			console.error("[DEBUG] Error parsing token JSON:", parseError);
			return null;
		}
	} catch (error) {
		console.error("[DEBUG] Error loading token cache:", error);
		return null;
	}
}

/**
 * Saves authentication tokens to the token file
 */
export async function saveTokenCache(tokens: TokenData): Promise<boolean> {
	try {
		const tokenPath = config.AUTH_CONFIG.tokenStorePath;
		console.error(`Saving tokens to: ${tokenPath}`);

		await Bun.write(tokenPath, JSON.stringify(tokens, null, 2));
		console.error("Tokens saved successfully");

		cachedTokens = tokens;
		return true;
	} catch (error) {
		console.error("Error saving token cache:", error);
		return false;
	}
}

/**
 * Gets the current access token, loading from cache if necessary
 */
export async function getAccessToken(): Promise<string | null> {
	if (cachedTokens?.access_token) {
		return cachedTokens.access_token;
	}

	const tokens = await loadTokenCache();
	return tokens?.access_token ?? null;
}

/**
 * Creates a test access token for use in test mode
 */
export async function createTestTokens(): Promise<TokenData> {
	const testTokens: TokenData = {
		access_token: `test_access_token_${Date.now()}`,
		refresh_token: `test_refresh_token_${Date.now()}`,
		expires_at: Date.now() + 3600 * 1000,
	};

	await saveTokenCache(testTokens);
	return testTokens;
}

export default {
	loadTokenCache,
	saveTokenCache,
	getAccessToken,
	createTestTokens,
};
