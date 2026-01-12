import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { JSON_CONTENT_TYPE_REGEX } from "../constants/regex";
import { MessageKind } from "../../shared/types/MessageKind";
import type { ScanResponseMessage } from "../types/ScanResponseMessage";
import {
  getContentType,
  normalizeMethod,
  normalizeUrl,
  readBodyText,
  withBodyInit,
  withBodyRequest,
} from "./requestUtils";
import {
  isChatGPTTarget,
  pending,
  requestSanitizedBody,
} from "./pageSctiptUtils";

const originalFetch = window.fetch.bind(window);

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as Partial<ScanResponseMessage>;
  if (
    !data ||
    data.source !== MESSAGE_SOURCE ||
    data.kind !== MessageKind.ScanResponse ||
    !data.id
  )
    return;

  const resolve = pending.get(data.id);
  if (!resolve) return;

  pending.delete(data.id);
  resolve(String(data.sanitizedBodyText ?? ""));
});

window.fetch = async function sanitizedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const url = normalizeUrl(input);
    const method = normalizeMethod(input, init);

    if (!isChatGPTTarget(url)) {
      return originalFetch(input, init);
    }

    const contentType = getContentType(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (method !== "POST" || !JSON_CONTENT_TYPE_REGEX.test(contentType)) {
      return originalFetch(input, init);
    }

    const bodyText = await readBodyText(input, init);

    if (!bodyText) {
      return originalFetch(input, init);
    }

    const sanitizedBodyText = await requestSanitizedBody({
      url,
      method,
      bodyText,
    });

    if (input instanceof Request) {
      const newReq = withBodyRequest(input, sanitizedBodyText);
      return originalFetch(newReq);
    }

    const newInit = withBodyInit(init, sanitizedBodyText);

    return originalFetch(input, newInit);
  } catch {
    return originalFetch(input, init);
  }
};
