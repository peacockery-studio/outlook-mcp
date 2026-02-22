/**
 * Tests that handler error paths return isError: true
 * All handlers are called with missing/invalid args — no real API calls made.
 */
import { describe, expect, test } from "bun:test";
import {
	handleAcceptEvent,
	handleCancelEvent,
	handleCreateEvent,
	handleDeclineEvent,
	handleDeleteEvent,
	handleGetEvent,
	handleUpdateEvent,
	handleTentativelyAcceptEvent,
	handleForwardEvent,
	handleGetFreeBusy,
} from "../calendar";
import { handleListContacts, handleGetContact, handleCreateContact, handleUpdateContact, handleDeleteContact } from "../contacts";
import { handleArchiveEmail, handleDeleteEmail } from "../email/archive-delete";
import {
	handleGetMasterCategories,
	handleSetEmailCategories,
} from "../email/categories";
import { handleListEmails } from "../email/list";
import { handleMarkAsRead } from "../email/mark-as-read";
import { handleReadEmail } from "../email/read";
import { handleSendEmail } from "../email/send";
import { handleReplyEmail, handleReplyAllEmail } from "../email/reply";
import { handleForwardEmail } from "../email/forward";
import { handleCreateDraft, handleUpdateDraft, handleSendDraft } from "../email/drafts";
import { handleListAttachments, handleGetAttachment, handleAddAttachment } from "../email/attachments";
import { handleFlagEmail } from "../email/flag";
import { handleCopyEmail } from "../email/copy";
import { handleRenameFolder, handleDeleteFolder } from "../folder/manage";
import { handleCreateRule, handleDeleteRule, handleUpdateRule } from "../rules";
import { handleListTaskLists, handleCreateTaskList } from "../tasks/lists";
import { handleListTasks, handleGetTask, handleCreateTask, handleUpdateTask, handleDeleteTask } from "../tasks/tasks";
import { handleGetMailboxSettings } from "../settings/get";
import { handleUpdateOutOfOffice } from "../settings/out-of-office";
import { handleGetMailTips } from "../settings/mail-tips";

describe("email handlers — missing mailbox returns isError: true", () => {
	test("list-emails: missing mailbox", async () => {
		const res = await handleListEmails({});
		expect(res.isError).toBe(true);
	});

	test("read-email: missing mailbox", async () => {
		const res = await handleReadEmail({});
		expect(res.isError).toBe(true);
	});

	test("send-email: missing mailbox", async () => {
		const res = await handleSendEmail({} as never);
		expect(res.isError).toBe(true);
	});

	test("mark-as-read: missing mailbox", async () => {
		const res = await handleMarkAsRead({});
		expect(res.isError).toBe(true);
	});

	test("archive-email: missing mailbox", async () => {
		const res = await handleArchiveEmail({});
		expect(res.isError).toBe(true);
	});

	test("delete-email: missing mailbox", async () => {
		const res = await handleDeleteEmail({});
		expect(res.isError).toBe(true);
	});

	test("get-master-categories: missing mailbox", async () => {
		const res = await handleGetMasterCategories({});
		expect(res.isError).toBe(true);
	});

	test("set-email-categories: missing mailbox", async () => {
		const res = await handleSetEmailCategories({});
		expect(res.isError).toBe(true);
	});
});

describe("email handlers — missing required args return isError: true", () => {
	test("read-email: missing id", async () => {
		const res = await handleReadEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("send-email: missing to", async () => {
		const res = await handleSendEmail({
			mailbox: "chi@desertservices.net",
			subject: "x",
			body: "y",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("send-email: missing subject", async () => {
		const res = await handleSendEmail({
			mailbox: "chi@desertservices.net",
			to: "a@b.com",
			body: "y",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("send-email: missing body", async () => {
		const res = await handleSendEmail({
			mailbox: "chi@desertservices.net",
			to: "a@b.com",
			subject: "x",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("mark-as-read: missing id", async () => {
		const res = await handleMarkAsRead({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("archive-email: missing id", async () => {
		const res = await handleArchiveEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("delete-email: missing id", async () => {
		const res = await handleDeleteEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("set-email-categories: missing id", async () => {
		const res = await handleSetEmailCategories({
			mailbox: "chi@desertservices.net",
		});
		expect(res.isError).toBe(true);
	});
});

describe("calendar handlers — missing mailbox returns isError: true", () => {
	test("accept-event: missing mailbox", async () => {
		const res = await handleAcceptEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("decline-event: missing mailbox", async () => {
		const res = await handleDeclineEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("cancel-event: missing mailbox", async () => {
		const res = await handleCancelEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("delete-event: missing mailbox", async () => {
		const res = await handleDeleteEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("create-event: missing mailbox", async () => {
		const res = await handleCreateEvent({} as never);
		expect(res.isError).toBe(true);
	});
});

describe("calendar handlers — missing required args return isError: true", () => {
	test("accept-event: missing eventId", async () => {
		const res = await handleAcceptEvent({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("decline-event: missing eventId", async () => {
		const res = await handleDeclineEvent({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("cancel-event: missing eventId", async () => {
		const res = await handleCancelEvent({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("delete-event: missing eventId", async () => {
		const res = await handleDeleteEvent({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("create-event: missing required fields", async () => {
		const res = await handleCreateEvent({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});
});

describe("rules handlers — missing mailbox returns isError: true", () => {
	test("create-rule: missing mailbox", async () => {
		const res = await handleCreateRule({} as never);
		expect(res.isError).toBe(true);
	});
});

describe("rules handlers — missing required args return isError: true", () => {
	test("create-rule: missing name", async () => {
		const res = await handleCreateRule({
			mailbox: "chi@desertservices.net",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("create-rule: missing condition", async () => {
		const res = await handleCreateRule({
			mailbox: "chi@desertservices.net",
			name: "Test",
			moveToFolder: "Inbox",
		} as never);
		expect(res.isError).toBe(true);
	});

	test("create-rule: missing action", async () => {
		const res = await handleCreateRule({
			mailbox: "chi@desertservices.net",
			name: "Test",
			fromAddresses: "x@y.com",
		} as never);
		expect(res.isError).toBe(true);
	});
});

// ---- New email handlers ----

describe("new email handlers — missing mailbox returns isError: true", () => {
	test("reply-email: missing mailbox", async () => {
		const res = await handleReplyEmail({});
		expect(res.isError).toBe(true);
	});

	test("reply-all-email: missing mailbox", async () => {
		const res = await handleReplyAllEmail({});
		expect(res.isError).toBe(true);
	});

	test("forward-email: missing mailbox", async () => {
		const res = await handleForwardEmail({});
		expect(res.isError).toBe(true);
	});

	test("create-draft: missing mailbox", async () => {
		const res = await handleCreateDraft({});
		expect(res.isError).toBe(true);
	});

	test("update-draft: missing mailbox", async () => {
		const res = await handleUpdateDraft({});
		expect(res.isError).toBe(true);
	});

	test("send-draft: missing mailbox", async () => {
		const res = await handleSendDraft({});
		expect(res.isError).toBe(true);
	});

	test("list-attachments: missing mailbox", async () => {
		const res = await handleListAttachments({});
		expect(res.isError).toBe(true);
	});

	test("get-attachment: missing mailbox", async () => {
		const res = await handleGetAttachment({});
		expect(res.isError).toBe(true);
	});

	test("add-attachment: missing mailbox", async () => {
		const res = await handleAddAttachment({});
		expect(res.isError).toBe(true);
	});

	test("flag-email: missing mailbox", async () => {
		const res = await handleFlagEmail({});
		expect(res.isError).toBe(true);
	});

	test("copy-email: missing mailbox", async () => {
		const res = await handleCopyEmail({});
		expect(res.isError).toBe(true);
	});
});

describe("new email handlers — missing required args return isError: true", () => {
	test("reply-email: missing id", async () => {
		const res = await handleReplyEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("forward-email: missing id", async () => {
		const res = await handleForwardEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("create-draft: missing subject", async () => {
		const res = await handleCreateDraft({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("send-draft: missing id", async () => {
		const res = await handleSendDraft({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("list-attachments: missing messageId", async () => {
		const res = await handleListAttachments({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("get-attachment: missing messageId", async () => {
		const res = await handleGetAttachment({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("flag-email: missing id", async () => {
		const res = await handleFlagEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("copy-email: missing id", async () => {
		const res = await handleCopyEmail({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});
});

// ---- New calendar handlers ----

describe("new calendar handlers — missing mailbox returns isError: true", () => {
	test("get-event: missing mailbox", async () => {
		const res = await handleGetEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("update-event: missing mailbox", async () => {
		const res = await handleUpdateEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("tentatively-accept-event: missing mailbox", async () => {
		const res = await handleTentativelyAcceptEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("forward-event: missing mailbox", async () => {
		const res = await handleForwardEvent({} as never);
		expect(res.isError).toBe(true);
	});

	test("get-free-busy: missing mailbox", async () => {
		const res = await handleGetFreeBusy({} as never);
		expect(res.isError).toBe(true);
	});
});

describe("new calendar handlers — missing required args return isError: true", () => {
	test("get-event: missing eventId", async () => {
		const res = await handleGetEvent({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});

	test("update-event: missing eventId", async () => {
		const res = await handleUpdateEvent({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});

	test("tentatively-accept-event: missing eventId", async () => {
		const res = await handleTentativelyAcceptEvent({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});

	test("forward-event: missing eventId", async () => {
		const res = await handleForwardEvent({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});

	test("get-free-busy: missing schedules", async () => {
		const res = await handleGetFreeBusy({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});
});

// ---- Folder management handlers ----

describe("folder manage handlers — missing mailbox returns isError: true", () => {
	test("rename-folder: missing mailbox", async () => {
		const res = await handleRenameFolder({});
		expect(res.isError).toBe(true);
	});

	test("delete-folder: missing mailbox", async () => {
		const res = await handleDeleteFolder({});
		expect(res.isError).toBe(true);
	});
});

describe("folder manage handlers — missing required args return isError: true", () => {
	test("rename-folder: missing folderName", async () => {
		const res = await handleRenameFolder({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("delete-folder: missing folderName", async () => {
		const res = await handleDeleteFolder({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});
});

// ---- Rules management handlers ----

describe("rules manage handlers — missing mailbox returns isError: true", () => {
	test("delete-rule: missing mailbox", async () => {
		const res = await handleDeleteRule({} as never);
		expect(res.isError).toBe(true);
	});

	test("update-rule: missing mailbox", async () => {
		const res = await handleUpdateRule({} as never);
		expect(res.isError).toBe(true);
	});
});

describe("rules manage handlers — missing required args return isError: true", () => {
	test("delete-rule: missing ruleName", async () => {
		const res = await handleDeleteRule({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});

	test("update-rule: missing ruleName", async () => {
		const res = await handleUpdateRule({ mailbox: "chi@desertservices.net" } as never);
		expect(res.isError).toBe(true);
	});
});

// ---- Contacts handlers ----

describe("contacts handlers — missing mailbox returns isError: true", () => {
	test("list-contacts: missing mailbox", async () => {
		const res = await handleListContacts({});
		expect(res.isError).toBe(true);
	});

	test("get-contact: missing mailbox", async () => {
		const res = await handleGetContact({});
		expect(res.isError).toBe(true);
	});

	test("create-contact: missing mailbox", async () => {
		const res = await handleCreateContact({});
		expect(res.isError).toBe(true);
	});

	test("update-contact: missing mailbox", async () => {
		const res = await handleUpdateContact({});
		expect(res.isError).toBe(true);
	});

	test("delete-contact: missing mailbox", async () => {
		const res = await handleDeleteContact({});
		expect(res.isError).toBe(true);
	});
});

describe("contacts handlers — missing required args return isError: true", () => {
	test("get-contact: missing contactId", async () => {
		const res = await handleGetContact({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("update-contact: missing contactId", async () => {
		const res = await handleUpdateContact({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("delete-contact: missing contactId", async () => {
		const res = await handleDeleteContact({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});
});

// ---- Tasks handlers ----

describe("tasks handlers — missing mailbox returns isError: true", () => {
	test("list-task-lists: missing mailbox", async () => {
		const res = await handleListTaskLists({});
		expect(res.isError).toBe(true);
	});

	test("create-task-list: missing mailbox", async () => {
		const res = await handleCreateTaskList({});
		expect(res.isError).toBe(true);
	});

	test("list-tasks: missing mailbox", async () => {
		const res = await handleListTasks({});
		expect(res.isError).toBe(true);
	});

	test("get-task: missing mailbox", async () => {
		const res = await handleGetTask({});
		expect(res.isError).toBe(true);
	});

	test("create-task: missing mailbox", async () => {
		const res = await handleCreateTask({});
		expect(res.isError).toBe(true);
	});

	test("update-task: missing mailbox", async () => {
		const res = await handleUpdateTask({});
		expect(res.isError).toBe(true);
	});

	test("delete-task: missing mailbox", async () => {
		const res = await handleDeleteTask({});
		expect(res.isError).toBe(true);
	});
});

describe("tasks handlers — missing required args return isError: true", () => {
	test("create-task-list: missing displayName", async () => {
		const res = await handleCreateTaskList({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("list-tasks: missing listId", async () => {
		const res = await handleListTasks({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("get-task: missing listId", async () => {
		const res = await handleGetTask({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("create-task: missing listId", async () => {
		const res = await handleCreateTask({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("delete-task: missing listId", async () => {
		const res = await handleDeleteTask({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});
});

// ---- Settings handlers ----

describe("settings handlers — missing mailbox returns isError: true", () => {
	test("get-mailbox-settings: missing mailbox", async () => {
		const res = await handleGetMailboxSettings({});
		expect(res.isError).toBe(true);
	});

	test("update-out-of-office: missing mailbox", async () => {
		const res = await handleUpdateOutOfOffice({});
		expect(res.isError).toBe(true);
	});

	test("get-mail-tips: missing mailbox", async () => {
		const res = await handleGetMailTips({});
		expect(res.isError).toBe(true);
	});
});

describe("settings handlers — missing required args return isError: true", () => {
	test("update-out-of-office: missing status", async () => {
		const res = await handleUpdateOutOfOffice({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});

	test("get-mail-tips: missing emailAddresses", async () => {
		const res = await handleGetMailTips({ mailbox: "chi@desertservices.net" });
		expect(res.isError).toBe(true);
	});
});
