import type { Issue } from "../../shared/types/Issue";
import { normalizeEmail } from "../../shared/utils";
import { DEFAULT_DISMISS_HOURS, EMAIL_PLACEHOLDER } from "../constants/email";
import { EMAIL_REGEX } from "../constants/regex";
import { DEFAULT_DELAY_MS, DEFAULT_RETRY_COUNT } from "../constants/request";
import type { DismissedMap } from "../types/DismissedMap";
import { StorageKey } from "../types/StorageKey";
import { storageGet, storageSet } from "./storageUtils";

export function isFinalPostRequest(bodyText: string): boolean {
  try {
    const obj = JSON.parse(bodyText);
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
  return (dismissed[normalizeEmail(email)] ?? 0) > Date.now();
}

export async function appendIssue(issue: Issue): Promise<void> {
  await withRetries(
    async () => {
      const issues = await storageGet<Issue[]>(StorageKey.Issues, []);

      if (issues.some((i) => i.id === issue.id)) return;

      issues.push(issue);
      await storageSet(StorageKey.Issues, issues);

      const verify = await storageGet<Issue[]>(StorageKey.Issues, []);
      if (!verify.some((i) => i.id === issue.id)) {
        throw new Error("verify failed: issue not persisted");
      }
    },
    DEFAULT_RETRY_COUNT,
    DEFAULT_DELAY_MS,
  );
}

export async function dismissEmail(
  email: string,
  hours = DEFAULT_DISMISS_HOURS,
): Promise<void> {
  await withRetries(
    async () => {
      const dismissed = await storageGet<DismissedMap>(
        StorageKey.Dismissed,
        {},
      );
      dismissed[normalizeEmail(email)] = Date.now() + hours * 60 * 60 * 1000;
      await storageSet(StorageKey.Dismissed, dismissed);
    },
    DEFAULT_RETRY_COUNT,
    DEFAULT_DELAY_MS,
  );
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

async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = DEFAULT_RETRY_COUNT,
  baseDelayMs = DEFAULT_DELAY_MS,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
