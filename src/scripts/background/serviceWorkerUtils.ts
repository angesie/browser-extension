import type { Issue } from "../../shared/types/Issue";
import { EMAIL_PLACEHOLDER } from "../constants/email";
import { EMAIL_REGEX } from "../constants/regex";
import type { DismissedMap } from "../types/DismissedMap";
import { StorageKey } from "../types/StorageKey";
import { storageGet, storageSet } from "./storageUtils";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isFinalPostRequest(bodyText: string): boolean {
  try {
    const obj = JSON.parse(bodyText) as any;
    if (obj && typeof obj === "object") {
      if ("partial_query" in obj) return false;
      if (obj.partial_query) return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function findEmails(bodyText: string): string[] {
  const matches = bodyText.match(EMAIL_REGEX) ?? [];
  return Array.from(new Set(matches.map(normalizeEmail)));
}

export function anonymize(bodyText: string): string {
  return bodyText.replace(EMAIL_REGEX, EMAIL_PLACEHOLDER);
}

export function isDismissed(email: string, dismissed: DismissedMap): boolean {
  return (dismissed[email] ?? 0) <= Date.now();
}

export async function appendIssue(issue: Issue): Promise<void> {
  const issues = await storageGet<Issue[]>(StorageKey.Issues, []);
  issues.push(issue);
  await storageSet(StorageKey.Issues, issues);
}

export async function dismissEmail(email: string, hours = 24): Promise<void> {
  const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});
  dismissed[normalizeEmail(email)] = Date.now() + hours * 60 * 60 * 1000;
  await storageSet(StorageKey.Dismissed, dismissed);
}

export async function clearExpiredDismissed(): Promise<void> {
  const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});
  const t = Date.now();
  let changed = false;

  for (const [email, until] of Object.entries(dismissed)) {
    if (until <= t) {
      delete dismissed[email];
      changed = true;
    }
  }

  if (changed) await storageSet(StorageKey.Dismissed, dismissed);
}