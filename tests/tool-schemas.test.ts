import { describe, expect, test } from "bun:test";
import { authTools } from "../auth";
import { calendarTools } from "../calendar";
import { contactsTools } from "../contacts";
import { emailTools } from "../email";
import { folderTools } from "../folder";
import { rulesTools } from "../rules";
import { settingsTools } from "../settings";
import { tasksTools } from "../tasks";

const ALL_TOOLS = [
	...authTools,
	...calendarTools,
	...emailTools,
	...folderTools,
	...rulesTools,
	...contactsTools,
	...tasksTools,
	...settingsTools,
];

describe("tool registry", () => {
	test("no duplicate tool names", () => {
		const names = ALL_TOOLS.map((t) => t.name);
		const unique = new Set(names);
		expect(unique.size).toBe(names.length);
	});

	test("expected tool count", () => {
		// 22 original + 36 new = 58 tools
		expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(55);
	});

	test("accept-event is registered", () => {
		expect(ALL_TOOLS.some((t) => t.name === "accept-event")).toBe(true);
	});

	test("new tools are registered", () => {
		const newTools = [
			"reply-email", "reply-all-email", "forward-email",
			"create-draft", "update-draft", "send-draft",
			"list-attachments", "get-attachment", "add-attachment",
			"flag-email", "copy-email",
			"get-event", "update-event", "tentatively-accept-event",
			"forward-event", "get-free-busy",
			"rename-folder", "delete-folder",
			"delete-rule", "update-rule",
			"list-contacts", "get-contact", "create-contact", "update-contact", "delete-contact",
			"list-task-lists", "create-task-list", "list-tasks", "get-task",
			"create-task", "update-task", "delete-task",
			"get-mailbox-settings", "update-out-of-office", "get-mail-tips",
		];
		for (const name of newTools) {
			expect(ALL_TOOLS.some((t) => t.name === name)).toBe(true);
		}
	});
});

describe("tool schema completeness", () => {
	for (const tool of ALL_TOOLS) {
		test(`${tool.name} has required fields`, () => {
			expect(typeof tool.name).toBe("string");
			expect(tool.name.length).toBeGreaterThan(0);
			expect(typeof tool.description).toBe("string");
			expect(tool.description.length).toBeGreaterThan(0);
			expect(tool.inputSchema).toBeDefined();
			expect(tool.inputSchema.type).toBe("object");
			expect(Array.isArray(tool.inputSchema.required)).toBe(true);
			expect(typeof tool.handler).toBe("function");
		});

		test(`${tool.name} has additionalProperties: false`, () => {
			expect(
				(tool.inputSchema as Record<string, unknown>).additionalProperties,
			).toBe(false);
		});

		test(`${tool.name} required fields exist in properties`, () => {
			const props = Object.keys(tool.inputSchema.properties ?? {});
			for (const req of tool.inputSchema.required ?? []) {
				expect(props).toContain(req);
			}
		});
	}
});
