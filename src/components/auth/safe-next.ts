const DEFAULT_AUTH_DESTINATION = "/dashboard";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function safeNextPath(
  value: string | string[] | undefined,
  fallback = DEFAULT_AUTH_DESTINATION,
) {
  const candidate = firstValue(value)?.trim();

  if (!candidate || candidate.length > 2_048) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\") || /[\u0000-\u001f\u007f]/.test(candidate))
    return fallback;

  try {
    const decoded = decodeURIComponent(candidate);
    if (decoded.startsWith("//") || decoded.includes("\\")) return fallback;

    const parsed = new URL(candidate, "https://lando.local");
    if (parsed.origin !== "https://lando.local") return fallback;

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function authHref(
  path: "/login" | "/register" | "/forgot-password",
  next: string,
) {
  const safeNext = safeNextPath(next);
  return `${path}?next=${encodeURIComponent(safeNext)}`;
}

export function verificationCallbackPath(next: string) {
  const params = new URLSearchParams({
    verified: "1",
    next: safeNextPath(next),
  });
  return `/verify-email?${params.toString()}`;
}
