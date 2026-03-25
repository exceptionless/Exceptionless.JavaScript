export function buildRequestContextFromRequest(request, body) {
  return buildRequestContext({
    method: request.method,
    pathOrUrl: request.url,
    headers: request.headers,
    body
  });
}

export function buildRequestContextFromOnRequestError(request) {
  return buildRequestContext({
    method: request.method,
    pathOrUrl: request.path,
    headers: request.headers
  });
}

export function buildRequestContext({ method, pathOrUrl, headers, body }) {
  const normalizedHeaders = normalizeHeaders(headers);
  const origin = getOrigin(normalizedHeaders);
  const url = new URL(pathOrUrl, origin);

  return {
    method,
    secure: url.protocol === "https:",
    ip: getClientIp(normalizedHeaders),
    hostname: url.hostname,
    path: url.pathname,
    headers: normalizedHeaders,
    params: Object.fromEntries(url.searchParams.entries()),
    body
  };
}

function normalizeHeaders(headers) {
  if (headers instanceof Headers) {
    return Object.fromEntries(Array.from(headers.entries()).map(([key, value]) => [key.toLowerCase(), value]));
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value)])
  );
}

function getOrigin(headers) {
  const host = headers["x-forwarded-host"] ?? headers.host ?? "localhost";
  const protocol = headers["x-forwarded-proto"] ?? "http";
  return `${protocol}://${host}`;
}

function getClientIp(headers) {
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return headers["x-real-ip"] ?? "";
}
