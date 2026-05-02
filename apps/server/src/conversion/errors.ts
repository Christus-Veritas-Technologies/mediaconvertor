export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return {
    status: 500,
    message,
  };
}
