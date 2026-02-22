import { describe, expect, test } from "bun:test";
import {
	canModifyMailbox,
	canSendFrom,
	formatAllowedMailboxes,
	MAILBOX_PERMISSIONS,
} from "../config/mailbox-permissions";

describe("canSendFrom", () => {
	test("allows permitted mailboxes", () => {
		for (const mailbox of MAILBOX_PERMISSIONS.canSend) {
			expect(canSendFrom(mailbox)).toBe(true);
		}
	});

	test("is case-insensitive", () => {
		expect(canSendFrom("CHI@DESERTSERVICES.NET")).toBe(true);
		expect(canSendFrom("Chi@DesertServices.Net")).toBe(true);
	});

	test("blocks unlisted mailboxes", () => {
		expect(canSendFrom("random@desertservices.net")).toBe(false);
		expect(canSendFrom("info@desertservices.net")).toBe(false);
		expect(canSendFrom("attacker@evil.com")).toBe(false);
		expect(canSendFrom("")).toBe(false);
	});
});

describe("canModifyMailbox", () => {
	test("allows permitted mailboxes", () => {
		for (const mailbox of MAILBOX_PERMISSIONS.canModify) {
			expect(canModifyMailbox(mailbox)).toBe(true);
		}
	});

	test("is case-insensitive", () => {
		expect(canModifyMailbox("CONTRACTS@DESERTSERVICES.NET")).toBe(true);
	});

	test("blocks unlisted mailboxes", () => {
		expect(canModifyMailbox("readonly@desertservices.net")).toBe(false);
		expect(canModifyMailbox("")).toBe(false);
	});
});

describe("formatAllowedMailboxes", () => {
	test("returns non-empty string", () => {
		const result = formatAllowedMailboxes();
		expect(result.length).toBeGreaterThan(0);
	});

	test("includes all permitted mailbox prefixes", () => {
		const result = formatAllowedMailboxes();
		for (const mailbox of MAILBOX_PERMISSIONS.canSend) {
			const prefix = mailbox.split("@")[0];
			expect(result).toContain(prefix);
		}
	});
});
