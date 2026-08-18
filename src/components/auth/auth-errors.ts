type AuthErrorShape = {
  code?: unknown;
  status?: unknown;
};

function readError(error: unknown): AuthErrorShape {
  return typeof error === "object" && error !== null
    ? (error as AuthErrorShape)
    : {};
}

export function authErrorCode(error: unknown) {
  const code = readError(error).code;
  return typeof code === "string" ? code.toUpperCase() : "";
}

export function isEmailVerificationError(error: unknown) {
  const code = authErrorCode(error);
  return code.includes("EMAIL") && code.includes("VERIF");
}

export function isRateLimitError(error: unknown) {
  const { status } = readError(error);
  const code = authErrorCode(error);
  return (
    status === 429 || code.includes("RATE_LIMIT") || code.includes("TOO_MANY")
  );
}

export function isAuthServiceError(error: unknown) {
  const { status } = readError(error);
  return typeof status === "number" && status >= 500;
}

export function loginErrorMessage(error: unknown) {
  if (isEmailVerificationError(error)) {
    return "Подтвердите email по ссылке из письма, затем попробуйте войти снова.";
  }

  if (isRateLimitError(error)) {
    return "Слишком много попыток. Подождите немного и попробуйте снова.";
  }

  return "Не удалось войти. Проверьте email и пароль.";
}

export function registrationErrorMessage(error: unknown) {
  if (isRateLimitError(error)) {
    return "Слишком много попыток регистрации. Подождите немного и попробуйте снова.";
  }

  return "Не удалось создать аккаунт. Проверьте данные или попробуйте войти.";
}

export function resetErrorMessage(error: unknown) {
  if (isRateLimitError(error)) {
    return "Слишком много попыток. Подождите немного и попробуйте снова.";
  }

  const code = authErrorCode(error);
  if (code.includes("TOKEN") || code.includes("EXPIRED")) {
    return "Ссылка устарела или уже использована. Запросите новую ссылку.";
  }

  return "Не удалось изменить пароль. Запросите новую ссылку и попробуйте ещё раз.";
}
