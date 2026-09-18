import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "revokr_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionMode = "github" | "demo";

export interface SessionUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Session {
  mode: SessionMode;
  user: SessionUser;
  expiresAt: number;
}

interface SessionPayload extends Session {
  // The GitHub user access token, AES-GCM encrypted. Never sent to the browser in readable form.
  token: string | null;
}

const devSecretHolder = globalThis as unknown as { revokrDevSessionKey?: Buffer };

function signingKey(): Buffer {
  const configured = process.env.SESSION_SECRET;
  if (configured) return createHash("sha256").update(configured).digest();
  // Without SESSION_SECRET only demo sessions are issued (GitHub login is disabled), so a
  // per-process key is enough; those sessions simply end when the server restarts.
  devSecretHolder.revokrDevSessionKey ??= randomBytes(32);
  return devSecretHolder.revokrDevSessionKey;
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(signingKey()).update("revokr-token").digest();
}

const toBase64Url = (buffer: Buffer) => buffer.toString("base64url");

function sign(data: string): string {
  return toBase64Url(createHmac("sha256", signingKey()).update(data).digest());
}

function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(toBase64Url).join(".");
}

function decryptToken(value: string): string | null {
  try {
    const [iv, tag, data] = value.split(".").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function encodeSession(
  session: Omit<Session, "expiresAt">,
  githubToken: string | null,
): { value: string; maxAge: number } {
  const payload: SessionPayload = {
    ...session,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
    token: githubToken ? encryptToken(githubToken) : null,
  };
  const data = toBase64Url(Buffer.from(JSON.stringify(payload), "utf8"));
  return { value: `${data}.${sign(data)}`, maxAge: MAX_AGE_SECONDS };
}

function decodePayload(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [data, signature] = value.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const readPayload = cache(async () => decodePayload((await cookies()).get(SESSION_COOKIE)?.value));

export const getSession = cache(async (): Promise<Session | null> => {
  const payload = await readPayload();
  return payload ? { mode: payload.mode, user: payload.user, expiresAt: payload.expiresAt } : null;
});

export const getGitHubToken = cache(async (): Promise<string | null> => {
  const payload = await readPayload();
  return payload?.token ? decryptToken(payload.token) : null;
});

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
