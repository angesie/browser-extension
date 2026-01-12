import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { Issue } from "../../shared/types/Issue";
import { MessageKind } from "../../shared/types/MessageKind";
import { DEFAULT_DISMISS_HOURS } from "../constants/email";
import { POPUP_HEIGHT, POPUP_WIDTH } from "../constants/popup";
import type { DismissedMap } from "../types/DismissedMap";
import { StorageKey } from "../types/StorageKey";
import { anonymize, appendIssue, clearExpiredDismissed, dismissEmail, findEmails, isDismissed, isFinalPostRequest } from "./serviceWorkerUtils";
import { storageGet, storageSet } from "./storageUtils";
import { ScanRequestSchema, DismissEmailSchema } from "./messageSchemas";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (!message || message.source !== MESSAGE_SOURCE || !message.kind) return;

  (async () => {
    await clearExpiredDismissed();

    switch (message.kind) {
      case MessageKind.ScanRequest: {
        const parsed = ScanRequestSchema.safeParse(message);
        if (!parsed.success) {
          const bodyText = typeof (message as any)?.bodyText === "string" ? (message as any).bodyText : "";
          sendResponse(bodyText);
          return;
        }

        const data = parsed.data;

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
        const parsed = DismissEmailSchema.safeParse(message);
        if (!parsed.success) {
          sendResponse({ ok: false, error: "invalid message" });
          return;
        }

        await dismissEmail(parsed.data.email, DEFAULT_DISMISS_HOURS);
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
    if (message?.kind === MessageKind.ScanRequest) {
      const bodyText = typeof message?.bodyText === "string" ? message.bodyText : "";
      sendResponse(bodyText);
    } else {
      sendResponse({ ok: false });
    }
  });

  return true;
});
