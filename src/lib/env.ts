import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalNonEmptyString = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(maxLength).optional(),
  );

const optionalSecret = z.preprocess(
  emptyToUndefined,
  z.string().min(16).max(4096).optional(),
);

const optionalEncryptionKey = z.preprocess(
  emptyToUndefined,
  z.string().min(32).max(4096).optional(),
);

const optionalPort = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(65_535).optional(),
);

const databaseUrlSchema = z
  .string()
  .min(1)
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        context.addIssue({
          code: "custom",
          message: "должен использовать протокол postgres:// или postgresql://",
        });
      }
    } catch {
      context.addIssue({
        code: "custom",
        message: "должен быть корректным PostgreSQL URL",
      });
    }
  });

const appUrlSchema = z
  .string()
  .url()
  .superRefine((value, context) => {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "должен использовать протокол http:// или https://",
      });
    }
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      context.addIssue({
        code: "custom",
        message:
          "не должен содержать credentials, путь, query-параметры или fragment",
      });
    }
  })
  .transform((value) => new URL(value).origin);

const rootDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(253)
  .regex(
    /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})$/,
    "должен быть hostname без протокола, пути и порта",
  );

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    APP_NAME: z.string().trim().min(1).max(80),
    APP_URL: appUrlSchema,
    PLATFORM_ROOT_DOMAIN: rootDomainSchema,

    DATABASE_URL: databaseUrlSchema,
    AUTH_SECRET: z.string().min(32).max(4096),
    ENCRYPTION_KEY: optionalEncryptionKey,

    LLM_PROVIDER: z.enum(["mock", "gigachat", "openai", "yandex"]),
    GIGACHAT_CREDENTIALS: optionalSecret,
    GIGACHAT_CLIENT_ID: optionalNonEmptyString(512),
    GIGACHAT_CLIENT_SECRET: optionalSecret,
    GIGACHAT_SCOPE: z
      .enum(["GIGACHAT_API_PERS", "GIGACHAT_API_B2B", "GIGACHAT_API_CORP"])
      .optional(),
    GIGACHAT_MODEL: optionalNonEmptyString(100),
    OPENAI_API_KEY: optionalSecret,
    YANDEX_CLOUD_API_KEY: optionalSecret,

    STORAGE_PROVIDER: z.enum(["local", "s3"]),
    S3_ENDPOINT: optionalNonEmptyString(2048),
    S3_REGION: optionalNonEmptyString(100),
    S3_BUCKET: optionalNonEmptyString(255),
    S3_ACCESS_KEY: optionalSecret,
    S3_SECRET_KEY: optionalSecret,
    S3_PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),

    EMAIL_PROVIDER: z.enum(["console", "smtp"]),
    SMTP_HOST: optionalNonEmptyString(253),
    SMTP_PORT: optionalPort,
    SMTP_USER: optionalNonEmptyString(512),
    SMTP_PASSWORD: optionalSecret,
    EMAIL_FROM: z.preprocess(
      emptyToUndefined,
      z.string().trim().email().max(320).optional(),
    ),

    BILLING_PROVIDER: z.enum(["mock", "yookassa"]),
    YOOKASSA_SHOP_ID: optionalNonEmptyString(255),
    YOOKASSA_SECRET_KEY: optionalSecret,
    YOOKASSA_WEBHOOK_SECRET: optionalSecret,

    REGRU_API_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    REGRU_API_USERNAME: optionalNonEmptyString(255),
    REGRU_API_PASSWORD: optionalSecret,
    TELEGRAM_ENCRYPTION_KEY: optionalEncryptionKey,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.EMAIL_PROVIDER === "console" && value.NODE_ENV === "production") {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "console является локальным mock и запрещён в production",
      });
    }

    if (value.EMAIL_PROVIDER === "smtp") {
      if (!value.SMTP_HOST) {
        context.addIssue({
          code: "custom",
          path: ["SMTP_HOST"],
          message: "обязателен для EMAIL_PROVIDER=smtp",
        });
      }
      if (!value.SMTP_PORT) {
        context.addIssue({
          code: "custom",
          path: ["SMTP_PORT"],
          message: "обязателен для EMAIL_PROVIDER=smtp",
        });
      }
      if (!value.EMAIL_FROM) {
        context.addIssue({
          code: "custom",
          path: ["EMAIL_FROM"],
          message: "обязателен для EMAIL_PROVIDER=smtp",
        });
      }
    }

    if (value.LLM_PROVIDER === "gigachat") {
      const hasCredentials = Boolean(value.GIGACHAT_CREDENTIALS);
      const hasClientPair = Boolean(
        value.GIGACHAT_CLIENT_ID && value.GIGACHAT_CLIENT_SECRET,
      );
      if (!hasCredentials && !hasClientPair) {
        context.addIssue({
          code: "custom",
          path: ["GIGACHAT_CREDENTIALS"],
          message:
            "для LLM_PROVIDER=gigachat нужен GIGACHAT_CREDENTIALS или пара Client ID/Client Secret",
        });
      }
    }

    if (value.LLM_PROVIDER === "openai" && !value.OPENAI_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["OPENAI_API_KEY"],
        message: "обязателен для LLM_PROVIDER=openai",
      });
    }

    if (value.LLM_PROVIDER === "yandex" && !value.YANDEX_CLOUD_API_KEY) {
      context.addIssue({
        code: "custom",
        path: ["YANDEX_CLOUD_API_KEY"],
        message: "обязателен для LLM_PROVIDER=yandex",
      });
    }

    if (value.STORAGE_PROVIDER === "s3") {
      const requiredS3Fields = [
        ["S3_ENDPOINT", value.S3_ENDPOINT],
        ["S3_REGION", value.S3_REGION],
        ["S3_BUCKET", value.S3_BUCKET],
        ["S3_ACCESS_KEY", value.S3_ACCESS_KEY],
        ["S3_SECRET_KEY", value.S3_SECRET_KEY],
        ["S3_PUBLIC_URL", value.S3_PUBLIC_URL],
      ] as const;

      for (const [field, configuredValue] of requiredS3Fields) {
        if (!configuredValue) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: "обязателен для STORAGE_PROVIDER=s3",
          });
        }
      }
    }

    if (value.BILLING_PROVIDER === "yookassa") {
      const requiredBillingFields = [
        ["YOOKASSA_SHOP_ID", value.YOOKASSA_SHOP_ID],
        ["YOOKASSA_SECRET_KEY", value.YOOKASSA_SECRET_KEY],
        ["YOOKASSA_WEBHOOK_SECRET", value.YOOKASSA_WEBHOOK_SECRET],
      ] as const;

      for (const [field, configuredValue] of requiredBillingFields) {
        if (!configuredValue) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: "обязателен для BILLING_PROVIDER=yookassa",
          });
        }
      }
    }

    if (value.REGRU_API_ENABLED) {
      if (!value.REGRU_API_USERNAME) {
        context.addIssue({
          code: "custom",
          path: ["REGRU_API_USERNAME"],
          message: "обязателен при REGRU_API_ENABLED=true",
        });
      }
      if (!value.REGRU_API_PASSWORD) {
        context.addIssue({
          code: "custom",
          path: ["REGRU_API_PASSWORD"],
          message: "обязателен при REGRU_API_ENABLED=true",
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const selectKnownEnvironment = (
  source: NodeJS.ProcessEnv,
): Record<keyof z.input<typeof serverEnvSchema>, string | undefined> => ({
  NODE_ENV: source.NODE_ENV,
  APP_NAME: source.APP_NAME,
  APP_URL: source.APP_URL,
  PLATFORM_ROOT_DOMAIN: source.PLATFORM_ROOT_DOMAIN,
  DATABASE_URL: source.DATABASE_URL,
  AUTH_SECRET: source.AUTH_SECRET,
  ENCRYPTION_KEY: source.ENCRYPTION_KEY,
  LLM_PROVIDER: source.LLM_PROVIDER,
  GIGACHAT_CREDENTIALS: source.GIGACHAT_CREDENTIALS,
  GIGACHAT_CLIENT_ID: source.GIGACHAT_CLIENT_ID,
  GIGACHAT_CLIENT_SECRET: source.GIGACHAT_CLIENT_SECRET,
  GIGACHAT_SCOPE: source.GIGACHAT_SCOPE,
  GIGACHAT_MODEL: source.GIGACHAT_MODEL,
  OPENAI_API_KEY: source.OPENAI_API_KEY,
  YANDEX_CLOUD_API_KEY: source.YANDEX_CLOUD_API_KEY,
  STORAGE_PROVIDER: source.STORAGE_PROVIDER,
  S3_ENDPOINT: source.S3_ENDPOINT,
  S3_REGION: source.S3_REGION,
  S3_BUCKET: source.S3_BUCKET,
  S3_ACCESS_KEY: source.S3_ACCESS_KEY,
  S3_SECRET_KEY: source.S3_SECRET_KEY,
  S3_PUBLIC_URL: source.S3_PUBLIC_URL,
  EMAIL_PROVIDER: source.EMAIL_PROVIDER,
  SMTP_HOST: source.SMTP_HOST,
  SMTP_PORT: source.SMTP_PORT,
  SMTP_USER: source.SMTP_USER,
  SMTP_PASSWORD: source.SMTP_PASSWORD,
  EMAIL_FROM: source.EMAIL_FROM,
  BILLING_PROVIDER: source.BILLING_PROVIDER,
  YOOKASSA_SHOP_ID: source.YOOKASSA_SHOP_ID,
  YOOKASSA_SECRET_KEY: source.YOOKASSA_SECRET_KEY,
  YOOKASSA_WEBHOOK_SECRET: source.YOOKASSA_WEBHOOK_SECRET,
  REGRU_API_ENABLED: source.REGRU_API_ENABLED,
  REGRU_API_USERNAME: source.REGRU_API_USERNAME,
  REGRU_API_PASSWORD: source.REGRU_API_PASSWORD,
  TELEGRAM_ENCRYPTION_KEY: source.TELEGRAM_ENCRYPTION_KEY,
});

const formatValidationError = (error: z.ZodError): string =>
  error.issues
    .map(
      (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
    )
    .join("; ");

export function parseServerEnv(source: NodeJS.ProcessEnv): ServerEnv {
  const result = serverEnvSchema.safeParse(selectKnownEnvironment(source));

  if (!result.success) {
    throw new Error(
      `Некорректная конфигурация окружения: ${formatValidationError(result.error)}`,
    );
  }

  return Object.freeze(result.data);
}

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Серверная конфигурация недоступна в браузере");
  }

  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
