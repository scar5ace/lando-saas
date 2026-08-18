const DEFAULT_MAX_TEXT_LENGTH = 4_000;

export const UNTRUSTED_JSON_LIMITS = {
  maxBytes: 256 * 1024,
  maxDepth: 24,
  maxNodes: 10_000,
} as const;

const BLOCKED_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const DANGEROUS_ELEMENT_PATTERN =
  /<\s*(script|style|iframe|object|embed|svg|math|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;
const ANGLE_BRACKET_PATTERN = /[<>]/g;
const UNSAFE_CONTROL_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const BIDI_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069]/g;

export class UnsafeInputError extends Error {
  readonly code:
    | "INVALID_JSON"
    | "PAYLOAD_TOO_LARGE"
    | "PAYLOAD_TOO_DEEP"
    | "PAYLOAD_TOO_COMPLEX"
    | "CYCLIC_VALUE";

  constructor(
    code: UnsafeInputError["code"],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "UnsafeInputError";
    this.code = code;
  }
}

export type SanitizeTextOptions = {
  maxLength?: number;
  preserveLineBreaks?: boolean;
};

/**
 * Converts untrusted copy to inert plain text. This is not an HTML sanitizer:
 * markup is deliberately discarded because PageSchema never stores HTML.
 */
export function sanitizePlainText(
  input: string,
  options: SanitizeTextOptions = {},
): string {
  const maxLength = options.maxLength ?? DEFAULT_MAX_TEXT_LENGTH;
  const withoutMarkup = input
    .normalize("NFKC")
    .replace(DANGEROUS_ELEMENT_PATTERN, " ")
    .replace(HTML_COMMENT_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(ANGLE_BRACKET_PATTERN, " ")
    .replace(UNSAFE_CONTROL_PATTERN, "")
    .replace(BIDI_CONTROL_PATTERN, "");

  const normalizedWhitespace = options.preserveLineBreaks
    ? withoutMarkup
        .replace(/[\t\f\v ]+/g, " ")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
    : withoutMarkup.replace(/\s+/g, " ");

  return Array.from(normalizedWhitespace.trim()).slice(0, maxLength).join("");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function assertUntrustedJsonSize(
  serialized: string,
  maxBytes = UNTRUSTED_JSON_LIMITS.maxBytes,
): void {
  if (byteLength(serialized) > maxBytes) {
    throw new UnsafeInputError(
      "PAYLOAD_TOO_LARGE",
      `JSON payload exceeds the ${maxBytes} byte limit.`,
    );
  }
}

export function parseUntrustedJson(
  serialized: string,
  maxBytes = UNTRUSTED_JSON_LIMITS.maxBytes,
): unknown {
  assertUntrustedJsonSize(serialized, maxBytes);

  try {
    return JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new UnsafeInputError("INVALID_JSON", "The value is not valid JSON.", {
      cause: error,
    });
  }
}

type WalkState = {
  nodes: number;
  readonly seen: WeakSet<object>;
};

/**
 * Recursively copies JSON-like input, removes prototype-pollution keys and
 * converts every string to plain text. Unknown business fields intentionally
 * remain present so a following strict Zod schema rejects them.
 */
export function sanitizeUntrustedJsonValue(
  input: unknown,
  depth = 0,
  state: WalkState = { nodes: 0, seen: new WeakSet<object>() },
): unknown {
  if (depth > UNTRUSTED_JSON_LIMITS.maxDepth) {
    throw new UnsafeInputError(
      "PAYLOAD_TOO_DEEP",
      "JSON payload is nested too deeply.",
    );
  }

  state.nodes += 1;
  if (state.nodes > UNTRUSTED_JSON_LIMITS.maxNodes) {
    throw new UnsafeInputError(
      "PAYLOAD_TOO_COMPLEX",
      "JSON payload contains too many values.",
    );
  }

  if (typeof input === "string") {
    return sanitizePlainText(input, { preserveLineBreaks: true });
  }

  if (
    input === null ||
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return input;
  }

  if (Array.isArray(input)) {
    if (state.seen.has(input)) {
      throw new UnsafeInputError(
        "CYCLIC_VALUE",
        "Cyclic values are not valid JSON.",
      );
    }
    state.seen.add(input);
    const result = input.map((item) =>
      sanitizeUntrustedJsonValue(item, depth + 1, state),
    );
    state.seen.delete(input);
    return result;
  }

  if (typeof input === "object") {
    if (state.seen.has(input)) {
      throw new UnsafeInputError(
        "CYCLIC_VALUE",
        "Cyclic values are not valid JSON.",
      );
    }
    state.seen.add(input);

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (BLOCKED_OBJECT_KEYS.has(key)) {
        continue;
      }
      result[key] = sanitizeUntrustedJsonValue(value, depth + 1, state);
    }

    state.seen.delete(input);
    return result;
  }

  // Functions, symbols, bigint and undefined cannot be represented in JSON.
  return null;
}

export function prepareUntrustedJson(input: unknown): unknown {
  if (typeof input === "string") {
    return sanitizeUntrustedJsonValue(parseUntrustedJson(input));
  }

  let serialized: string;
  try {
    const result = JSON.stringify(input);
    if (result === undefined) {
      throw new TypeError("Value cannot be serialized as JSON.");
    }
    serialized = result;
  } catch (error) {
    throw new UnsafeInputError(
      "INVALID_JSON",
      "Value cannot be serialized as JSON.",
      {
        cause: error,
      },
    );
  }

  assertUntrustedJsonSize(serialized);
  return sanitizeUntrustedJsonValue(input);
}

export const sanitizeText = sanitizePlainText;
export const sanitizePageSchemaInput = prepareUntrustedJson;
