import path from "node:path";
import config from "./config.js";

console.log("SERVER_NAME:", config.SERVER_NAME);
console.log("HOME env:", process.env.HOME);
console.log("USERPROFILE env:", process.env.USERPROFILE);
console.log("tokenStorePath:", config.AUTH_CONFIG.tokenStorePath);
console.log(
	"Calculated path:",
	process.env.HOME
		? path.join(process.env.HOME, ".outlook-mcp-tokens.json")
		: path.join(process.env.USERPROFILE || "", ".outlook-mcp-tokens.json"),
);
