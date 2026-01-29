#!/usr/bin/env bun
import path from "node:path";

console.log("Starting Outlook Authentication Server");

interface AuthConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string[];
	tokenStorePath: string;
}

const AUTH_CONFIG: AuthConfig = {
	clientId: process.env.MS_CLIENT_ID || "",
	clientSecret: process.env.MS_CLIENT_SECRET || "",
	redirectUri: "http://localhost:3333/auth/callback",
	scopes: [
		"offline_access",
		"User.Read",
		"Mail.Read",
		"Mail.Send",
		"Calendars.Read",
		"Calendars.ReadWrite",
		"Contacts.Read",
	],
	tokenStorePath: path.join(
		process.env.HOME || process.env.USERPROFILE || "",
		".outlook-mcp-tokens.json",
	),
};

interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	expires_at?: number;
	token_type?: string;
	scope?: string;
}

const HTML_STYLES = {
	base: `
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 4px; }
  `,
	error: `
    h1 { color: #d9534f; }
    .error-box { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; }
  `,
	success: `
    h1 { color: #5cb85c; }
    .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; }
  `,
	info: `
    h1 { color: #0078d4; }
    .info-box { background-color: #e7f6fd; border: 1px solid #b3e0ff; padding: 15px; border-radius: 4px; }
  `,
};

function createHtmlResponse(
	title: string,
	body: string,
	styleType: "error" | "success" | "info",
	status = 200,
): Response {
	const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${HTML_STYLES.base}
          ${HTML_STYLES[styleType]}
        </style>
      </head>
      <body>
        ${body}
      </body>
    </html>
  `;
	return new Response(html, {
		status,
		headers: { "Content-Type": "text/html" },
	});
}

async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
	const response = await fetch(
		"https://login.microsoftonline.com/common/oauth2/v2.0/token",
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: AUTH_CONFIG.clientId,
				client_secret: AUTH_CONFIG.clientSecret,
				code: code,
				redirect_uri: AUTH_CONFIG.redirectUri,
				grant_type: "authorization_code",
				scope: AUTH_CONFIG.scopes.join(" "),
			}),
		},
	);

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(
			`Token exchange failed with status ${response.status}: ${errorData}`,
		);
	}

	const tokenResponse = (await response.json()) as TokenResponse;
	const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
	tokenResponse.expires_at = expiresAt;

	await Bun.write(
		AUTH_CONFIG.tokenStorePath,
		JSON.stringify(tokenResponse, null, 2),
	);
	console.log(`Tokens saved to ${AUTH_CONFIG.tokenStorePath}`);

	return tokenResponse;
}

async function handleAuthCallback(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const error = url.searchParams.get("error");
	const errorDescription = url.searchParams.get("error_description");
	const code = url.searchParams.get("code");

	if (error) {
		console.error(`Authentication error: ${error} - ${errorDescription}`);
		return createHtmlResponse(
			"Authentication Error",
			`
        <h1>Authentication Error</h1>
        <div class="error-box">
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${errorDescription || "No description provided"}</p>
        </div>
        <p>Please close this window and try again.</p>
      `,
			"error",
			400,
		);
	}

	if (code) {
		console.log("Authorization code received, exchanging for tokens...");
		try {
			await exchangeCodeForTokens(code);
			console.log("Token exchange successful");
			return createHtmlResponse(
				"Authentication Successful",
				`
          <h1>Authentication Successful!</h1>
          <div class="success-box">
            <p>You have successfully authenticated with Microsoft Graph API.</p>
            <p>The access token has been saved securely.</p>
          </div>
          <p>You can now close this window and return to Claude.</p>
        `,
				"success",
			);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			console.error(`Token exchange error: ${errorMessage}`);
			return createHtmlResponse(
				"Token Exchange Error",
				`
          <h1>Token Exchange Error</h1>
          <div class="error-box">
            <p>${errorMessage}</p>
          </div>
          <p>Please close this window and try again.</p>
        `,
				"error",
				500,
			);
		}
	}

	console.error("No authorization code provided");
	return createHtmlResponse(
		"Missing Authorization Code",
		`
      <h1>Missing Authorization Code</h1>
      <div class="error-box">
        <p>No authorization code was provided in the callback.</p>
      </div>
      <p>Please close this window and try again.</p>
    `,
		"error",
		400,
	);
}

function handleAuth(req: Request): Response {
	console.log("Auth request received, redirecting to Microsoft login...");

	if (!AUTH_CONFIG.clientId || !AUTH_CONFIG.clientSecret) {
		return createHtmlResponse(
			"Configuration Error",
			`
        <h1>Configuration Error</h1>
        <div class="error-box">
          <p>Microsoft Graph API credentials are not set. Please set the following environment variables:</p>
          <ul>
            <li><code>MS_CLIENT_ID</code></li>
            <li><code>MS_CLIENT_SECRET</code></li>
          </ul>
        </div>
      `,
			"error",
			500,
		);
	}

	const url = new URL(req.url);
	const clientId = url.searchParams.get("client_id") || AUTH_CONFIG.clientId;

	const authParams = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		redirect_uri: AUTH_CONFIG.redirectUri,
		scope: AUTH_CONFIG.scopes.join(" "),
		response_mode: "query",
		state: Date.now().toString(),
	});

	const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${authParams.toString()}`;
	console.log(`Redirecting to: ${authUrl}`);

	return new Response(null, {
		status: 302,
		headers: { Location: authUrl },
	});
}

function handleHome(): Response {
	return createHtmlResponse(
		"Outlook Authentication Server",
		`
      <h1>Outlook Authentication Server</h1>
      <div class="info-box">
        <p>This server is running to handle Microsoft Graph API authentication callbacks.</p>
        <p>Don't navigate here directly. Instead, use the <code>authenticate</code> tool in Claude to start the authentication process.</p>
        <p>Make sure you've set the <code>MS_CLIENT_ID</code> and <code>MS_CLIENT_SECRET</code> environment variables.</p>
      </div>
      <p>Server is running at http://localhost:3333</p>
    `,
		"info",
	);
}

const PORT = 3333;

const server = Bun.serve({
	port: PORT,
	routes: {
		"/": () => handleHome(),
		"/auth": (req) => handleAuth(req),
		"/auth/callback": async (req) => handleAuthCallback(req),
	},
	fetch() {
		return new Response("Not Found", { status: 404 });
	},
});

console.log(`Authentication server running at http://localhost:${server.port}`);
console.log(
	`Waiting for authentication callback at ${AUTH_CONFIG.redirectUri}`,
);
console.log(`Token will be stored at: ${AUTH_CONFIG.tokenStorePath}`);

if (!AUTH_CONFIG.clientId || !AUTH_CONFIG.clientSecret) {
	console.log("\nWARNING: Microsoft Graph API credentials are not set.");
	console.log(
		"   Please set the MS_CLIENT_ID and MS_CLIENT_SECRET environment variables.",
	);
}

process.on("SIGINT", () => {
	console.log("Authentication server shutting down");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("Authentication server shutting down");
	process.exit(0);
});
