import type { AuthEmailMessage, EmailProvider } from "./types";

function assertSafeLink(value: string): URL {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Email link must use HTTP or HTTPS");
  }

  return url;
}

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console-mock";
  readonly isMock = true;

  async send(message: AuthEmailMessage): Promise<void> {
    const url = assertSafeLink(message.url);

    // This local-only mock intentionally prints the one-time URL so a developer
    // can complete verification/reset without pretending that an email was sent.
    console.info(
      `[email:console-mock] ${message.kind}; письмо не отправлено; локальная ссылка: ${url.toString()}`,
    );
  }
}
