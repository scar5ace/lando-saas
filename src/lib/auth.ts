import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/lib/db";
import { sendAuthEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";

const environment = getServerEnv();

function sendEmailInBackground(
  message: Parameters<typeof sendAuthEmail>[0],
): void {
  void sendAuthEmail(message).catch(() => {
    // Do not log addresses, tokens, URLs, or provider error objects.
    console.error("Не удалось обработать auth email");
  });
}

export const auth = betterAuth({
  appName: environment.APP_NAME,
  baseURL: environment.APP_URL,
  basePath: "/api/auth",
  secret: environment.AUTH_SECRET,
  trustedOrigins: [environment.APP_URL],
  database: prismaAdapter(db, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      sendEmailInBackground({
        kind: "password-reset",
        to: user.email,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      sendEmailInBackground({
        kind: "email-verification",
        to: user.email,
        url,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 5,
    cookieCache: {
      enabled: false,
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 10 * 60, max: 3 },
      "/send-verification-email": { window: 10 * 60, max: 3 },
      "/request-password-reset": { window: 10 * 60, max: 3 },
      "/reset-password": { window: 10 * 60, max: 5 },
    },
  },
  advanced: {
    cookiePrefix: "lando",
    useSecureCookies: environment.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
