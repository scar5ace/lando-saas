import { randomUUID } from "node:crypto";
import { request as httpsRequest } from "node:https";

import { jsonrepair } from "jsonrepair";
import { z } from "zod";

import { sanitizePlainText } from "@/lib/security/sanitize";
import type { BlockPatch, PagePatch, PageSchema } from "@/types/page-schema";
import type { GeneratePageInput, LLMProvider, TextResult } from "@/types/ai";

import { LLMProviderError } from "./provider";
import {
  buildPageFromGigaChatBrief,
  gigaChatContentBriefSchema,
} from "./gigachat-page-plan";

const DEFAULT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const DEFAULT_API_URL = "https://api.giga.chat/v1";
const DEFAULT_MODEL = "GigaChat-2";
const DEFAULT_SCOPE = "GIGACHAT_API_PERS";
const PROMPT_LIMIT = 2_000;
const REQUEST_TIMEOUT_MS = 120_000;
const GENERATION_REQUEST_TIMEOUT_MS = 55_000;
const CONNECTION_TIMEOUT_MS = 12_000;
const GENERATION_ATTEMPTS = 2;
const TRANSIENT_HTTP_RETRIES = 2;
const TRANSIENT_RETRY_DELAY_MS = 4_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const DNS_OVER_HTTPS_ADDRESSES = ["8.8.8.8", "8.8.4.4"] as const;

const accessTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_at: z.number().int().positive(),
});

const completionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().min(1) }),
      }),
    )
    .min(1),
});

type FetchLike = typeof fetch;

const dohAnswerSchema = z.object({
  Status: z.number().int(),
  Answer: z
    .array(
      z.object({
        type: z.number().int(),
        TTL: z.number().int().nonnegative().optional(),
        data: z.string(),
      }),
    )
    .optional(),
});

const addressCache = new Map<
  string,
  { addresses: string[]; expiresAt: number }
>();
let generationQueue: Promise<void> = Promise.resolve();

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function inGenerationQueue<T>(task: () => Promise<T>): Promise<T> {
  const previous = generationQueue;
  let release!: () => void;
  generationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
  }
}

/**
 * Happ VPN can make classic DNS return SERVFAIL for Sber hosts while HTTPS is
 * fully available. Resolve through DNS-over-HTTPS and keep TLS verification
 * tied to the original hostname; no certificate checks are disabled.
 */
async function resolveWithDnsOverHttps(hostname: string): Promise<string[]> {
  const cached = addressCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    const [first, ...remaining] = cached.addresses;
    cached.addresses = [...remaining, first];
    return cached.addresses;
  }

  let payload: string | undefined;
  let lastError: unknown;
  for (const address of DNS_OVER_HTTPS_ADDRESSES) {
    try {
      payload = await new Promise<string>((resolve, reject) => {
        const request = httpsRequest(
          {
            protocol: "https:",
            hostname: address,
            port: 443,
            path: `/resolve?name=${encodeURIComponent(hostname)}&type=A`,
            servername: "dns.google",
            headers: {
              Host: "dns.google",
              Accept: "application/dns-json",
            },
          },
          (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk: string) => {
              body += chunk;
              if (body.length > 65_536) {
                request.destroy(new Error("DNS response too large"));
              }
            });
            response.on("end", () => {
              if (response.statusCode !== 200) {
                reject(
                  new Error(`DNS-over-HTTPS returned ${response.statusCode}`),
                );
              } else {
                resolve(body);
              }
            });
          },
        );
        request.setTimeout(30_000, () =>
          request.destroy(new Error("DNS timeout")),
        );
        request.on("error", reject);
        request.end();
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!payload) {
    throw new Error("DNS-over-HTTPS is unavailable", { cause: lastError });
  }

  const parsed = dohAnswerSchema.parse(JSON.parse(payload));
  const answers = parsed.Answer?.filter(
    (item) => item.type === 1 && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(item.data),
  );
  const addresses = [...new Set(answers?.map((answer) => answer.data) ?? [])];
  if (parsed.Status !== 0 || addresses.length === 0) {
    throw new Error(`No IPv4 address returned for ${hostname}`);
  }

  addressCache.set(hostname, {
    addresses,
    expiresAt: Date.now() + Math.max(30, answers?.[0]?.TTL ?? 60) * 1_000,
  });
  return addresses;
}

function requestThroughAddress(
  url: URL,
  address: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Host", url.host);
  const body =
    typeof init?.body === "string"
      ? init.body
      : init?.body instanceof URLSearchParams
        ? init.body.toString()
        : undefined;

  return new Promise<Response>((resolve, reject) => {
    const request = httpsRequest(
      {
        protocol: "https:",
        hostname: address,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: init?.method ?? "GET",
        headers: Object.fromEntries(headers.entries()),
        servername: url.hostname,
        signal: init?.signal ?? undefined,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 5_000_000) {
            request.destroy(new Error("Generation response too large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode ?? 500,
              headers: response.headers as HeadersInit,
            }),
          );
        });
      },
    );

    request.on("socket", (socket) => {
      if (!socket.connecting) return;

      const connectionTimer = setTimeout(
        () => request.destroy(new Error("Generation connection timeout")),
        CONNECTION_TIMEOUT_MS,
      );
      const clearConnectionTimer = () => clearTimeout(connectionTimer);
      socket.once("secureConnect", clearConnectionTimer);
      socket.once("error", clearConnectionTimer);
      socket.once("close", clearConnectionTimer);
    });
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

async function secureGigaChatFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input);
  const addresses = await resolveWithDnsOverHttps(url.hostname);
  let lastError: unknown;

  for (const address of addresses) {
    try {
      return await requestThroughAddress(url, address, init);
    } catch (error) {
      lastError = error;
      if (init?.signal?.aborted) {
        addressCache.delete(url.hostname);
        throw error;
      }
    }
  }

  addressCache.delete(url.hostname);
  throw new Error("All generation service addresses are unavailable", {
    cause: lastError,
  });
}

export type GigaChatProviderOptions = {
  credentials?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  model?: string;
  authUrl?: string;
  apiUrl?: string;
  fetchImpl?: FetchLike;
};

function unsupported(capability: string): LLMProviderError {
  return new LLMProviderError(
    "PROVIDER_CAPABILITY_UNAVAILABLE",
    `Функция «${capability}» пока не подключена.`,
  );
}

function cleanPrompt(value: string): string {
  const prompt = sanitizePlainText(value, { maxLength: PROMPT_LIMIT }).trim();
  if (!prompt) {
    throw new LLMProviderError(
      "INVALID_PROVIDER_INPUT",
      "Опишите, какой сайт нужно создать.",
    );
  }
  return prompt;
}

function resolveCredentials(options: GigaChatProviderOptions): string {
  const prepared = options.credentials?.trim();
  if (prepared) return prepared.replace(/^Basic\s+/i, "");

  const clientId = options.clientId?.trim();
  const clientSecret = options.clientSecret?.trim();
  if (clientId && clientSecret) {
    return Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString(
      "base64",
    );
  }

  throw new LLMProviderError(
    "PROVIDER_NOT_CONFIGURED",
    "Сервис генерации не настроен: отсутствует ключ авторизации.",
  );
}

const SYSTEM_PROMPT = `Ты создаёшь профессиональные одностраничные сайты для российского рынка.
Верни только компактный содержательный бриф, соответствующий переданной JSON-схеме.
Требования:
- Пиши естественно и грамотно на русском языке, строго по задаче пользователя.
- Подбирай тексты, услуги, преимущества, этапы, стиль и вопросы строго под тематику запроса; не используй тексты из других отраслей.
- Не выдумывай реальные отзывы, награды, юридические гарантии, адреса, цены или контакты. Если данных нет, используй нейтральные формулировки и демонстрационные значения.
- Не создавай HTML, JavaScript, markdown и URL.
- Выбери один доступный стиль, соответствующий тематике сайта.`;

const RETRY_PROMPT = `Предыдущий ответ не удалось обработать.
Повтори ответ с нуля и особенно внимательно соблюдай JSON-схему.
Верни только один валидный JSON-объект без markdown, комментариев и лишних запятых.`;

function parseGeneratedPlan(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const json =
    firstBrace >= 0 && lastBrace > firstBrace
      ? withoutFence.slice(firstBrace, lastBrace + 1)
      : withoutFence;

  return JSON.parse(jsonrepair(json));
}

async function serviceResponseError(response: Response): Promise<Error> {
  let detail = "";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const nested =
        record.error && typeof record.error === "object"
          ? (record.error as Record<string, unknown>)
          : undefined;
      const candidate = record.message ?? nested?.message ?? record.error;
      if (typeof candidate === "string") {
        detail = sanitizePlainText(candidate, { maxLength: 300 }).trim();
      }
    }
  } catch {
    // Some error responses have no JSON body. The HTTP status is still useful.
  }

  return new Error(
    detail
      ? `Generation service HTTP ${response.status}: ${detail}`
      : `Generation service HTTP ${response.status}`,
  );
}

export class GigaChatProvider implements LLMProvider {
  private readonly credentials: string;
  private readonly scope: string;
  private readonly model: string;
  private readonly authUrl: string;
  private readonly apiUrl: string;
  private readonly fetchImpl: FetchLike;
  private cachedToken?: { value: string; expiresAt: number };

  constructor(options: GigaChatProviderOptions = {}) {
    this.credentials = resolveCredentials({
      credentials: options.credentials ?? process.env.GIGACHAT_CREDENTIALS,
      clientId: options.clientId ?? process.env.GIGACHAT_CLIENT_ID,
      clientSecret: options.clientSecret ?? process.env.GIGACHAT_CLIENT_SECRET,
    });
    this.scope = options.scope ?? process.env.GIGACHAT_SCOPE ?? DEFAULT_SCOPE;
    this.model = options.model ?? process.env.GIGACHAT_MODEL ?? DEFAULT_MODEL;
    this.authUrl = options.authUrl ?? DEFAULT_AUTH_URL;
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? (secureGigaChatFetch as FetchLike);
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.cachedToken &&
      this.cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()
    ) {
      return this.cachedToken.value;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(this.authUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          RqUID: randomUUID(),
        },
        body: new URLSearchParams({ scope: this.scope }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new LLMProviderError(
        "PROVIDER_RESPONSE_INVALID",
        "Не удалось подключиться к сервису генерации.",
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new LLMProviderError(
        "PROVIDER_RESPONSE_INVALID",
        `Сервис генерации отклонил авторизацию (HTTP ${response.status}).`,
      );
    }

    const parsed = accessTokenResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new LLMProviderError(
        "PROVIDER_RESPONSE_INVALID",
        "Сервис генерации вернул некорректный ответ авторизации.",
      );
    }

    this.cachedToken = {
      value: parsed.data.access_token,
      expiresAt: parsed.data.expires_at,
    };
    return parsed.data.access_token;
  }

  generatePage(input: GeneratePageInput): Promise<PageSchema> {
    return inGenerationQueue(() => this.generatePageQueued(input));
  }

  private async generatePageQueued(
    input: GeneratePageInput,
  ): Promise<PageSchema> {
    const prompt = cleanPrompt(input.prompt);
    const token = await this.getAccessToken();
    const jsonSchema = z.toJSONSchema(gigaChatContentBriefSchema, {
      unrepresentable: "any",
    });

    let lastPlanError: unknown;

    for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
      let response: Response;
      try {
        response = await this.fetchImpl(`${this.apiUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json; charset=utf-8",
            ...(input.correlationId
              ? { "X-Request-ID": input.correlationId }
              : {}),
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content:
                  attempt > 0
                    ? `${SYSTEM_PROMPT}\n\n${RETRY_PROMPT}`
                    : SYSTEM_PROMPT,
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
            top_p: 0.9,
            max_tokens: 8_000,
            stream: false,
            response_format: {
              type: "json_schema",
              schema: jsonSchema,
              strict: false,
            },
          }),
          signal: AbortSignal.timeout(GENERATION_REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        lastPlanError = error;
        if (attempt < GENERATION_ATTEMPTS - 1) continue;
        throw new LLMProviderError(
          "PROVIDER_RESPONSE_INVALID",
          "Не удалось получить ответ от сервиса генерации.",
          { cause: error },
        );
      }

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < TRANSIENT_HTTP_RETRIES
      ) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delayMs = Number.isFinite(retryAfter)
          ? Math.min(Math.max(retryAfter * 1_000, 1_000), 15_000)
          : TRANSIENT_RETRY_DELAY_MS * (attempt + 1);
        await delay(delayMs);
        continue;
      }

      if (!response.ok) {
        throw new LLMProviderError(
          "PROVIDER_RESPONSE_INVALID",
          `Сервис генерации не смог создать страницу (HTTP ${response.status}).`,
          { cause: await serviceResponseError(response) },
        );
      }

      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch (error) {
        lastPlanError = error;
        continue;
      }

      const completion = completionResponseSchema.safeParse(responseBody);
      if (!completion.success) {
        lastPlanError = completion.error;
        continue;
      }

      try {
        const candidate = parseGeneratedPlan(
          completion.data.choices[0].message.content,
        );
        const brief = gigaChatContentBriefSchema.parse(candidate);
        return buildPageFromGigaChatBrief(brief);
      } catch (error) {
        lastPlanError = error;
      }
    }

    throw new LLMProviderError(
      "PROVIDER_RESPONSE_INVALID",
      "Сервис генерации не смог подготовить корректную структуру страницы.",
      { cause: lastPlanError },
    );
  }

  editPage(): Promise<PagePatch> {
    return Promise.reject(unsupported("редактирование всей страницы"));
  }

  editBlock(): Promise<BlockPatch> {
    return Promise.reject(unsupported("редактирование блока"));
  }

  regenerateText(): Promise<TextResult> {
    return Promise.reject(unsupported("переписывание текста"));
  }
}
