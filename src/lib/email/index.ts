import type { ServerEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env";

import { ConsoleEmailProvider } from "./console-provider";
import type { AuthEmailMessage, EmailProvider } from "./types";

export type { AuthEmailKind, AuthEmailMessage, EmailProvider } from "./types";

export function createEmailProvider(
  environment: Pick<ServerEnv, "EMAIL_PROVIDER" | "NODE_ENV">,
): EmailProvider {
  if (environment.EMAIL_PROVIDER === "console") {
    if (environment.NODE_ENV === "production") {
      throw new Error("Console email mock запрещён в production");
    }

    return new ConsoleEmailProvider();
  }

  throw new Error(
    "SMTP email provider ещё не реализован; используйте console только локально",
  );
}

let cachedEmailProvider: EmailProvider | undefined;

export function getEmailProvider(): EmailProvider {
  cachedEmailProvider ??= createEmailProvider(getServerEnv());
  return cachedEmailProvider;
}

export async function sendAuthEmail(message: AuthEmailMessage): Promise<void> {
  await getEmailProvider().send(message);
}
