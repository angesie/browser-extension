import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { Issue } from "../../shared/types/Issue";
import { MessageKind } from "../../shared/types/MessageKind";
import { EMAIL_PLACEHOLDER } from "../constants/email";
import { EMAIL_REGEX } from "../constants/regex";
import type { ScanRequestMessage } from "../types/ScanRequestMessage";
import type { ServiceWorkerScanResult } from "../types/ServiceWorkerScanReqult";
import { StorageKey } from "../types/StorageKey";

type DismissedMap = Record<string, number>;

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function now(): number {
  return Date.now();
}

async function storageGet<T>(key: string, fallback: T): Promise<T> {
  const data = await chrome.storage.local.get(key);
  return (data?.[key] as T) ?? fallback;
}

async function storageSet<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

function detectIsFinal(bodyText: string): boolean {
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

function findEmails(bodyText: string): string[] {
  const matches = bodyText.match(EMAIL_REGEX) ?? [];
  return uniq(matches.map(normalizeEmail));
}

function anonymize(bodyText: string): string {
  return bodyText.replace(EMAIL_REGEX, EMAIL_PLACEHOLDER);
}

function filterNotDismissed(
  emails: string[],
  dismissed: DismissedMap,
): string[] {
  const t = now();
  return emails.filter((e) => (dismissed[e] ?? 0) <= t);
}

async function appendIssue(issue: Issue): Promise<void> {
  const issues = await storageGet<Issue[]>(StorageKey.Issues, []);
  issues.push(issue);
  await storageSet(StorageKey.Issues, issues);
}

async function dismissEmail(email: string, hours = 24): Promise<void> {
  const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});
  dismissed[normalizeEmail(email)] = now() + hours * 60 * 60 * 1000;
  await storageSet(StorageKey.Dismissed, dismissed);
}

async function clearExpiredDismissed(): Promise<void> {
  const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});
  const t = now();
  let changed = false;

  for (const [email, until] of Object.entries(dismissed)) {
    if (until <= t) {
      delete dismissed[email];
      changed = true;
    }
  }

  if (changed) await storageSet(StorageKey.Dismissed, dismissed);
}

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (!msg || msg.source !== MESSAGE_SOURCE || !msg.kind) return;

  (async () => {
    await clearExpiredDismissed();

    switch (msg.kind) {
      case MessageKind.ScanRequest: {
        console.log("[PM] request intercepted by SW " + msg.id);
        const data = msg as ScanRequestMessage;

        const isFinal = detectIsFinal(data.bodyText);

        const emailsFound = findEmails(data.bodyText);
        const sanitizedBodyText = emailsFound.length
          ? anonymize(data.bodyText)
          : data.bodyText;

        const dismissed = await storageGet<DismissedMap>(
          StorageKey.Dismissed,
          {},
        );
        const notDismissedEmails = filterNotDismissed(emailsFound, dismissed);

        if (isFinal && emailsFound.length) {
          const issue: Issue = {
            id: data.id,
            createdAt: now(),
            url: data.url,
            method: data.method,
            isFinal,
            emails: notDismissedEmails,
          };
          await appendIssue(issue);
        }

        if (isFinal && notDismissedEmails.length) {
          await chrome.action.openPopup();
          const url = chrome.runtime.getURL("index.html");

          await chrome.windows.create({
            url,
            type: "popup",
            width: 420,
            height: 600,
            focused: true,
          });
        }

        const result: ServiceWorkerScanResult = {
          sanitizedBodyText,
          alertEmails: notDismissedEmails,
          isFinal,
        };

        sendResponse(result);
        return;
      }

      case MessageKind.DismissEmail: {
        if (typeof msg.email === "string" && msg.email.trim()) {
          await dismissEmail(msg.email, 24);
        }
        sendResponse({ ok: true });
        return;
      }

      case MessageKind.GetHistory: {
        const issues = await storageGet<Issue[]>(StorageKey.Issues, []);
        const dismissed = await storageGet<DismissedMap>(
          StorageKey.Dismissed,
          {},
        );
        sendResponse({ issues, dismissed });
        return;
      }

      case MessageKind.ClearHistory: {
        await storageSet<Issue[]>(StorageKey.Issues, []);
        sendResponse({ ok: true });
        return;
      }

      default:
        sendResponse({ ok: false, error: "Unknown kind" });
        return;
    }
  })().catch(() => {
    if (msg?.kind === MessageKind.ScanRequest) {
      const bodyText = typeof msg?.bodyText === "string" ? msg.bodyText : "";
      sendResponse({
        sanitizedBodyText: bodyText,
        alertEmails: [],
        isFinal: true,
      } satisfies ServiceWorkerScanResult);
    } else {
      sendResponse({ ok: false });
    }
  });

  return true;
});
