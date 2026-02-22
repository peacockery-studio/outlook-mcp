/**
 * Authentication module for Outlook MCP server
 */
import tokenManager from "./token-manager";
import { authTools } from "./tools";

/**
 * Ensures the user is authenticated and returns an access token
 */
export async function ensureAuthenticated(forceNew = false): Promise<string> {
	if (forceNew) {
		throw new Error("Authentication required");
	}

	const accessToken = await tokenManager.getAccessToken();
	if (!accessToken) {
		throw new Error("Authentication required");
	}

	return accessToken;
}

export { tokenManager, authTools };
export default {
	tokenManager,
	authTools,
	ensureAuthenticated,
};
