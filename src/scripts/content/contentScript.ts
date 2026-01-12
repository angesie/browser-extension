import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { MessageKind } from "../../shared/types/MessageKind";
import type { ScanRequestMessage } from "../types/ScanRequestMessage";
import type { ScanResponseMessage } from "../types/ScanResponseMessage";

function injectPageScript(): void {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("pageScript.js");
  script.type = "text/javascript";
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

function sendToServiceWorker<TResponse>(message: unknown): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: TResponse) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(response);
    });
  });
}

window.addEventListener("message", async (event: MessageEvent) => {
  if (event.source !== window) return;

  const data = event.data as Partial<ScanRequestMessage>;
  if (!data) return;

  if (data.source !== MESSAGE_SOURCE) return;
  if (data.kind !== MessageKind.ScanRequest) return;

  if (!data.id || typeof data.id !== "string") return;
  if (typeof data.bodyText !== "string") return;

  try {
    const sanitizedBodyText = await sendToServiceWorker<string>(data);

    const responseMsg: ScanResponseMessage = {
      source: MESSAGE_SOURCE,
      kind: MessageKind.ScanResponse,
      id: data.id,
      sanitizedBodyText: sanitizedBodyText ?? data.bodyText,
    };

    window.postMessage(responseMsg, "*");
  } catch {
    const responseMsg: ScanResponseMessage = {
      source: MESSAGE_SOURCE,
      kind: MessageKind.ScanResponse,
      id: data.id,
      sanitizedBodyText: data.bodyText,
    };
    window.postMessage(responseMsg, "*");
  }
});

injectPageScript();
