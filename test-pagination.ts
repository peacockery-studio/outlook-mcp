/**
 * Test pagination functionality manually
 */

import { ensureAuthenticated } from "./auth/index.js";
import config from "./config.js";
import { callGraphAPIPaginated } from "./utils/graph-api.js";

interface Email {
	id: string;
	subject: string;
	receivedDateTime: string;
	from?: {
		emailAddress?: {
			name?: string;
			address?: string;
		};
	};
}

interface PaginatedResponse {
	value: Email[];
	"@odata.count"?: number;
}

async function testPagination(): Promise<void> {
	try {
		console.log("Testing Pagination Functionality\n");
		console.log("===================================\n");

		console.log("1. Authenticating...");
		const accessToken = await ensureAuthenticated();
		console.log("   Authentication successful\n");

		console.log("2. Test 1: Fetching 10 emails (single page)...");
		const test1 = (await callGraphAPIPaginated(
			accessToken,
			"GET",
			"me/messages",
			{
				$top: 10,
				$orderby: "receivedDateTime desc",
				$select: config.EMAIL_SELECT_FIELDS,
			},
			10,
		)) as PaginatedResponse;
		console.log(`   Retrieved ${test1.value.length} emails\n`);

		console.log("3. Test 2: Fetching 100 emails (requires pagination)...");
		const test2Start = Date.now();
		const test2 = (await callGraphAPIPaginated(
			accessToken,
			"GET",
			"me/messages",
			{
				$top: 50,
				$orderby: "receivedDateTime desc",
				$select: config.EMAIL_SELECT_FIELDS,
			},
			100,
		)) as PaginatedResponse;
		const test2Duration = Date.now() - test2Start;
		console.log(
			`   Retrieved ${test2.value.length} emails in ${test2Duration}ms\n`,
		);

		console.log("4. Test 3: Fetching 200 emails (extensive pagination)...");
		const test3Start = Date.now();
		const test3 = (await callGraphAPIPaginated(
			accessToken,
			"GET",
			"me/messages",
			{
				$top: 50,
				$orderby: "receivedDateTime desc",
				$select: config.EMAIL_SELECT_FIELDS,
			},
			200,
		)) as PaginatedResponse;
		const test3Duration = Date.now() - test3Start;
		console.log(
			`   Retrieved ${test3.value.length} emails in ${test3Duration}ms\n`,
		);

		console.log("===================================");
		console.log("All pagination tests passed!");
		console.log("\nResults:");
		console.log(`  - 10 emails: ${test1.value.length} retrieved`);
		console.log(
			`  - 100 emails: ${test2.value.length} retrieved (${test2Duration}ms)`,
		);
		console.log(
			`  - 200 emails: ${test3.value.length} retrieved (${test3Duration}ms)`,
		);

		console.log("\nSample (Latest 3 emails):");
		test1.value.slice(0, 3).forEach((email: Email, i: number) => {
			const date = new Date(email.receivedDateTime).toLocaleDateString();
			const from = email.from?.emailAddress?.name || "Unknown";
			console.log(`   ${i + 1}. [${date}] ${from}: ${email.subject}`);
		});
	} catch (error) {
		console.error("Test failed:", (error as Error).message);
		console.error((error as Error).stack);
		process.exit(1);
	}
}

testPagination();
