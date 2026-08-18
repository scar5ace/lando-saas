export type AuthEmailKind = "email-verification" | "password-reset";

export type AuthEmailMessage = Readonly<{
  kind: AuthEmailKind;
  to: string;
  url: string;
}>;

export interface EmailProvider {
  readonly name: string;
  readonly isMock: boolean;
  send(message: AuthEmailMessage): Promise<void>;
}
