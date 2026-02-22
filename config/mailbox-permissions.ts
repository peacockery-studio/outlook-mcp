/**
 * Mailbox permission configuration
 *
 * Controls which mailboxes can perform write operations (send, delete, archive)
 * All other mailboxes are read-only
 */

export interface MailboxPermissions {
	/** Mailboxes that can send emails */
	canSend: string[];
	/** Mailboxes that can delete/archive emails */
	canModify: string[];
	/** Mailboxes that are completely read-only (optional - if empty, all unlisted are read-only) */
	readOnly?: string[];
}

export const MAILBOX_PERMISSIONS: MailboxPermissions = {
	// Only these mailboxes can send emails
	canSend: [
		"contracts@desertservices.net",
		"chi@desertservices.net",
		"dustpermits@desertservices.net",
	],
	// Only these mailboxes can delete/archive/modify emails
	canModify: [
		"contracts@desertservices.net",
		"chi@desertservices.net",
		"dustpermits@desertservices.net",
	],
};

/**
 * Check if a mailbox can send emails
 */
export function canSendFrom(mailbox: string): boolean {
	return MAILBOX_PERMISSIONS.canSend.some(
		(allowed) => allowed.toLowerCase() === mailbox.toLowerCase(),
	);
}

/**
 * Check if a mailbox can be modified (delete, archive, move)
 */
export function canModifyMailbox(mailbox: string): boolean {
	return MAILBOX_PERMISSIONS.canModify.some(
		(allowed) => allowed.toLowerCase() === mailbox.toLowerCase(),
	);
}

/**
 * Format allowed mailboxes for error messages
 */
export function formatAllowedMailboxes(): string {
	return MAILBOX_PERMISSIONS.canSend
		.map((email) => `${email.split("@")[0]}@`)
		.join(", ");
}
