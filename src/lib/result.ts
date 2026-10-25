export type AppError = { ok: false; code: string; message_es: string };
export type AppResult<T> = { ok: true; data: T } | AppError;
export const fail = (code: string, message_es: string): AppError => ({ ok: false, code, message_es });
