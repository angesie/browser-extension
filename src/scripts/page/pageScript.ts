import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { CHATGPT_URL_PATTERNS, JSON_CONTENT_TYPE_REGEX } from "../constants/regex";
import { MessageKind } from "../../shared/types/MessageKind";
import type { ScanRequestMessage } from "../types/ScanRequestMessage";
import type { ScanResponseMessage } from "../types/ScanResponseMessage";

const originalFetch = window.fetch.bind(window);

const pending = new Map<string, (sanitized: string) => void>();

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as Partial<ScanResponseMessage>;
  if (!data || data.source !== MESSAGE_SOURCE || data.kind !== MessageKind.ScanResponse || !data.id)
    return;

  const resolve = pending.get(data.id);
  if (!resolve) return;

  pending.delete(data.id);
  resolve(String(data.sanitizedBodyText ?? ""));
});

function isChatGPTTarget(url: string): boolean {
  return CHATGPT_URL_PATTERNS.some((re) => re.test(url));
}

function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function normalizeMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input === "string" || input instanceof URL) return "GET";
  return (input.method || "GET").toUpperCase();
}

function getContentType(headers: HeadersInit | undefined): string {
  if (!headers) return "";
  if (headers instanceof Headers) return headers.get("content-type") ?? "";
  if (Array.isArray(headers)) {
    const found = headers.find(([k]) => k.toLowerCase() === "content-type");
    return found?.[1] ?? "";
  }
  return (
    (headers as Record<string, string>)["content-type"] ??
    (headers as Record<string, string>)["Content-Type"] ??
    ""
  );
}

async function readBodyText(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<string | null> {
  const body = init?.body;
  if (typeof body === "string") return body;

  if (input instanceof Request) {
    try {
      const cloned = input.clone();
      return await cloned.text();
    } catch {
      return null;
    }
  }

  return null;
}

function withBodyInit(
  init: RequestInit | undefined,
  bodyText: string,
): RequestInit {
  return { ...(init ?? {}), body: bodyText };
}

function withBodyRequest(req: Request, bodyText: string): Request {
  const newHeaders = new Headers(req.headers);
  if (!newHeaders.has("content-type")) {
    newHeaders.set("content-type", "application/json");
  }

  return new Request(req.url, {
    ...req,
    headers: newHeaders,
    body: bodyText,
  });
}

async function requestSanitizedBody(args: {
  url: string;
  method: string;
  bodyText: string;
  timeoutMs?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const timeoutMs = args.timeoutMs ?? 1500;

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
        resolve(args.bodyText);
      }
    }, timeoutMs);
  });

  return Promise.race([sanitizedPromise, timeoutPromise]);
}

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
    if (
      method !== "POST" ||
      !JSON_CONTENT_TYPE_REGEX.test(contentType)
    ) {
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
