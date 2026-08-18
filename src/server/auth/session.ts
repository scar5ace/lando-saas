import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type CurrentSession = typeof auth.$Infer.Session;

export type SafeSession = Readonly<{
  session: Readonly<Pick<CurrentSession["session"], "expiresAt" | "id">>;
  user: Readonly<
    Pick<
      CurrentSession["user"],
      "email" | "emailVerified" | "id" | "image" | "name"
    >
  >;
}>;

export class AuthRequiredError extends Error {
  readonly code = "AUTH_REQUIRED";
  readonly status = 401;

  constructor() {
    super("Требуется авторизация");
    this.name = "AuthRequiredError";
  }
}

export async function getCurrentSession(
  requestHeaders?: Headers,
): Promise<CurrentSession | null> {
  const resolvedHeaders = requestHeaders ?? (await headers());

  return auth.api.getSession({
    headers: resolvedHeaders,
    query: {
      disableCookieCache: true,
    },
  });
}

export async function requireSession(
  requestHeaders?: Headers,
): Promise<CurrentSession> {
  const session = await getCurrentSession(requestHeaders);

  if (!session) {
    throw new AuthRequiredError();
  }

  return session;
}

export async function requireUser(
  requestHeaders?: Headers,
): Promise<CurrentSession["user"]> {
  return (await requireSession(requestHeaders)).user;
}

export function toSafeSession(session: CurrentSession): SafeSession {
  return {
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    },
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image,
    },
  };
}
