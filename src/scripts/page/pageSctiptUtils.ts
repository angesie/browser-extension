import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { MessageKind } from "../../shared/types/MessageKind";
import { CHATGPT_URL_PATTERNS } from "../constants/regex";
import { DEFAULT_TIMEOUT_MS } from "../constants/request";
import type { ScanRequestMessage } from "../types/ScanRequestMessage";

export const pending = new Map<string, (sanitized: string) => void>();

export function isChatGPTTarget(url: string): boolean {
  return CHATGPT_URL_PATTERNS.some((re) => re.test(url));
}

export async function requestSanitizedBody(args: {
  url: string;
  method: string;
  bodyText: string;
  timeoutMs?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const msg: ScanRequestMessage = {
    source: MESSAGE_SOURCE,
    kind: MessageKind.ScanRequest,
    id,
    url: args.url,
    method: args.method,
    bodyText: args.bodyText,
  };

  const sanitizedPromise = new Promise<string>((resolve) => {
    pending.set(id, resolve);
  });

  window.postMessage(msg, "*");

  const timeoutPromise = new Promise<string>((resolve) => {
    window.setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        console.warn(
          "[PromptMonitor:Page] request timed out, returning original bodyText",
          { id },
        );
        resolve(args.bodyText);
      }
    }, timeoutMs);
  });

  return Promise.race([sanitizedPromise, timeoutPromise]);
}
