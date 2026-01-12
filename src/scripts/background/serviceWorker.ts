import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { Issue } from "../../shared/types/Issue";
import { MessageKind } from "../../shared/types/MessageKind";
import type { DismissedMap } from "../types/DismissedMap";
import type { ScanRequestMessage } from "../types/ScanRequestMessage";
import { StorageKey } from "../types/StorageKey";
import { anonymize, appendIssue, clearExpiredDismissed, dismissEmail, findEmails, isDismissed, isFinalPostRequest } from "./serviceWorkerUtils";
import { storageGet, storageSet } from "./storageUtils";

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (!msg || msg.source !== MESSAGE_SOURCE || !msg.kind) return;

  (async () => {
    await clearExpiredDismissed();

    switch (msg.kind) {
      case MessageKind.ScanRequest: {
        console.log("[PM] request intercepted by Service Worker " + msg.id);
        const data = msg as ScanRequestMessage;

        const isFinal = isFinalPostRequest(data.bodyText);

        const emailsFound = findEmails(data.bodyText);
        const sanitizedBodyText = emailsFound.length
          ? anonymize(data.bodyText)
          : data.bodyText;

        const dismissed = await storageGet<DismissedMap>(
          StorageKey.Dismissed,
          {},
        );

        if (isFinal && emailsFound.length) {
          const issue: Issue = {
            id: data.id,
            createdAt: Date.now(),
            url: data.url,
            method: data.method,
            isFinal,
            emails: emailsFound.map((email) => {
              return { email, isDismissed: isDismissed(email, dismissed) };
            }),
          };
          await appendIssue(issue);
        }

        if (isFinal && emailsFound.some((e) => !isDismissed(e, dismissed))) {
          const url = chrome.runtime.getURL("index.html");

          await chrome.windows.create({
            url,
            type: "popup",
            width: 420,
            height: 600,
            focused: true,
          });
        }

        sendResponse(sanitizedBodyText);
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
      sendResponse(bodyText);
    } else {
      sendResponse({ ok: false });
    }
  });

  return true;
});
