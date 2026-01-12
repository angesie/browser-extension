export function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function normalizeMethod(
  input: RequestInfo | URL,
  init?: RequestInit,
): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input === "string" || input instanceof URL) return "GET";
  return (input.method || "GET").toUpperCase();
}

export function getContentType(headers: HeadersInit | undefined): string {
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

export async function readBodyText(
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

export function withBodyInit(
  init: RequestInit | undefined,
  bodyText: string,
): RequestInit {
  return { ...(init ?? {}), body: bodyText };
}

export function withBodyRequest(req: Request, bodyText: string): Request {
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
