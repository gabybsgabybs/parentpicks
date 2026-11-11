export function oauthReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  const origin = "https://app.invalid";
  try {
    const t = new URL(value, origin);
    if (t.origin !== origin || t.pathname.startsWith("//")) return "/";
    return t.pathname + t.search + t.hash;
  } catch { return "/"; }
}
