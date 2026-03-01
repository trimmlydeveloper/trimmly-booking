"use client";

import { useState, useEffect } from "react";

const ACCESS_TOKEN_COOKIE_NAME = "access_token";

const DEFAULT_MAX_AGE_DAYS = 3;

const ACCESS_TOKEN_CLEARED_EVENT = "access-token-cleared";
const ACCESS_TOKEN_UPDATED_EVENT = "access-token-updated";

/**
 * Sets the access token in document.cookie (client-side only).
 * Uses path=/, 3-day maxAge by default, sameSite=lax.
 * Dispatches access-token-updated so useAccessToken can use the new token for next requests.
 */
export function setAccessTokenCookie(token: string, maxAgeDays: number = DEFAULT_MAX_AGE_DAYS): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const value = encodeURIComponent(token);
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax${typeof window !== "undefined" && window.location?.protocol === "https:" ? "; secure" : ""}`;
  try {
    window.dispatchEvent(new CustomEvent(ACCESS_TOKEN_UPDATED_EVENT));
  } catch {
    // ignore in non-DOM env
  }
}

/**
 * Removes the access token cookie (e.g. when token is expired or after 401).
 * Dispatches a custom event so useAccessToken can update without reload.
 * Client-side only.
 */
export function removeAccessTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  try {
    window.dispatchEvent(new CustomEvent(ACCESS_TOKEN_CLEARED_EVENT));
  } catch {
    // ignore in non-DOM env
  }
}

/**
 * Reads the access token from document.cookie (client-side only).
 * Returns null if not in browser or cookie is missing.
 */
export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + encodeURIComponent(ACCESS_TOKEN_COOKIE_NAME) + "=([^;]*)")
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

/** Returns the access token from cookie after mount (client-only). Use for conditional API calls. */
export function useAccessToken(): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setToken(getAccessTokenFromCookie());
    read();
    const onCleared = () => setToken(null);
    const onUpdated = () => read();
    window.addEventListener(ACCESS_TOKEN_CLEARED_EVENT, onCleared);
    window.addEventListener(ACCESS_TOKEN_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener(ACCESS_TOKEN_CLEARED_EVENT, onCleared);
      window.removeEventListener(ACCESS_TOKEN_UPDATED_EVENT, onUpdated);
    };
  }, []);
  return token;
}
