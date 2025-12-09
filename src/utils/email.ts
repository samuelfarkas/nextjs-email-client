import { z } from 'zod';

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  return z.email().safeParse(email.trim()).success;
}

/**
 * Parses a comma-separated string of email addresses into an array
 */
export function parseEmailList(emailString: string | null): string[] {
  if (!emailString) return [];
  return emailString
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

/**
 * Extracts and capitalizes the sender name from an email address
 * Example: "john.doe@example.com" -> "John.doe"
 */
export function getSenderName(email: string): string {
  const name = email.split('@')[0] ?? email;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Adds "Re:" prefix to a subject if not already present
 */
export function getReplySubject(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed.toLowerCase().startsWith('re:')) {
    return trimmed;
  }
  return `Re: ${trimmed}`;
}
