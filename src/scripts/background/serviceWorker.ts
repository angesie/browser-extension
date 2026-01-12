import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { Issue } from "../../shared/types/Issue";
import { MessageKind } from "../../shared/types/MessageKind";
import { DEFAULT_DISMISS_HOURS } from "../constants/email";
import { POPUP_HEIGHT, POPUP_WIDTH } from "../constants/popup";
import type { DismissedMap } from "../types/DismissedMap";
import { StorageKey } from "../types/StorageKey";
import { anonymize, appendIssue, clearExpiredDismissed, dismissEmail, findEmails, isDismissed, isFinalPostRequest } from "./serviceWorkerUtils";
import { storageGet, storageSet } from "./storageUtils";
import { AnyMessageSchema } from "./messageSchemas";

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const raw = message as Record<string, unknown> | undefined;
  if (!raw || raw.source !== MESSAGE_SOURCE || !raw.kind) return;

  (async () => {
    await clearExpiredDismissed();

    const parsed = AnyMessageSchema.safeParse(message);
    if (!parsed.success) {
      // Keep backward-compatible fallback for scan requests (so fetch doesn't break)
      if (raw.kind === MessageKind.ScanRequest) {
        const bodyText = typeof raw?.bodyText === "string" ? (raw.bodyText as string) : "";
        sendResponse(bodyText);
        return;
      }

      sendResponse({ ok: false, error: "invalid message" });
      return;
    }

    const msg = parsed.data;

    switch (msg.kind) {
      case MessageKind.ScanRequest: {
        const data = msg;

        const isFinal = isFinalPostRequest(data.bodyText);

        const emailsFound = findEmails(data.bodyText);
        const sanitizedBodyText = emailsFound.length
          ? anonymize(data.bodyText)
          : data.bodyText;

        const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});

        if (isFinal && emailsFound.length) {
          const issue: Issue = {
            id: data.id,
            createdAt: Date.now(),
            url: data.url,
            method: data.method,
            isFinal,
            emails: emailsFound,
          };
          await appendIssue(issue);
        }

        if (isFinal && emailsFound.some((e) => !isDismissed(e, dismissed))) {
          const url = chrome.runtime.getURL("index.html");
          try {
            await chrome.windows.create({
              url,
              type: "popup",
              width: POPUP_WIDTH,
              height: POPUP_HEIGHT,
              focused: true,
            });
          } catch (err) {
            console.error("Failed to open popup window", err);
          }
        }

        sendResponse(sanitizedBodyText);
        return;
      }

      case MessageKind.DismissEmail: {
        await dismissEmail(msg.email, DEFAULT_DISMISS_HOURS);
        sendResponse({ ok: true });
        return;
      }

      case MessageKind.GetHistory: {
        const issues = await storageGet<Issue[]>(StorageKey.Issues, []);
        const dismissed = await storageGet<DismissedMap>(StorageKey.Dismissed, {});
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
  })().catch((err) => {
    console.error("serviceWorker onMessage handler failed", err);
    if (raw?.kind === MessageKind.ScanRequest) {
      const bodyText = typeof raw?.bodyText === "string" ? (raw.bodyText as string) : "";
      sendResponse(bodyText);
    } else {
      sendResponse({ ok: false });
    }
  });

  return true;
});
