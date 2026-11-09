import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "./auth";

const PUBLIC_HOSTS = new Set(["expedientes-digitales.apps.grok.bot"]);

function canonicalHost(host: string): string {
  const lower = host.trim().toLowerCase();
  return lower.replace(/:(443|80)$/, "");
}

function candidateHosts(request: Request): string[] {
  const hosts: string[] = [];
  const add = (raw: string | null) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      const host = canonicalHost(part);
      if (host) hosts.push(host);
    }
  };
  add(request.headers.get("x-forwarded-host"));
  add(request.headers.get("host"));
  try {
    hosts.push(canonicalHost(new URL(request.url).host));
  } catch {
    // The request URL can be unusable behind a proxy. The host headers remain.
  }
  return hosts;
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host.startsWith("localhost:") || host === "127.0.0.1" || host.startsWith("127.0.0.1:");
}

export function postOriginAllowed(request: Request, options?: { requireOrigin?: boolean }): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return !options?.requireOrigin;
  let originHost = "";
  try {
    originHost = canonicalHost(new URL(origin).host);
  } catch {
    return false;
  }
  if (PUBLIC_HOSTS.has(originHost)) return true;
  return candidateHosts(request).includes(originHost);
}

function redirectBase(request: Request): string {
  for (const host of candidateHosts(request)) {
    if (!PUBLIC_HOSTS.has(host) && !isLocalHost(host)) continue;
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const scheme =
      forwarded === "http" || forwarded === "https" ? forwarded : isLocalHost(host) ? "http" : "https";
    if (scheme === "http" && !isLocalHost(host)) return `https://${host}`;
    return `${scheme}://${host}`;
  }
  return "https://expedientes-digitales.apps.grok.bot";
}

export function redirectWithSession(request: Request, path: string, token?: string, clearSession = false) {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  const response = NextResponse.redirect(new URL(safe, redirectBase(request)), 303);
  response.headers.set("Cache-Control", "no-store");
  if (token) response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  if (clearSession) {
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  }
  return response;
}
