import type { ApiErrorCode } from "@/lib/http/responses";

export class ProjectServiceError extends Error {
  readonly status: number;
  readonly apiCode: ApiErrorCode;
  readonly retryAfterSeconds?: number;

  constructor(options: {
    status: number;
    apiCode: ApiErrorCode;
    message: string;
    retryAfterSeconds?: number;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "ProjectServiceError";
    this.status = options.status;
    this.apiCode = options.apiCode;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function projectNotFoundError(): ProjectServiceError {
  return new ProjectServiceError({
    status: 404,
    apiCode: "NOT_FOUND",
    message: "Проект не найден.",
  });
}

export function invalidStoredPageError(cause?: unknown): ProjectServiceError {
  return new ProjectServiceError({
    status: 500,
    apiCode: "INTERNAL_ERROR",
    message: "Сохранённая страница повреждена. Обратитесь в поддержку.",
    cause,
  });
}
