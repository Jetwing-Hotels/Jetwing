import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType } from 'zod';

/**
 * Thrown anywhere inside a route handler to short-circuit with an HTTP status.
 * The `route()` wrapper converts it to a JSON error response.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (msg: string, details?: unknown) => new ApiError(400, msg, details);
export const unauthorized = (msg = 'Authentication required') => new ApiError(401, msg);
export const forbidden = (msg = 'Insufficient permissions') => new ApiError(403, msg);
export const notFound = (msg = 'Not found') => new ApiError(404, msg);
export const conflict = (msg: string) => new ApiError(409, msg);

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

type Ctx = { params: Promise<Record<string, string>> };

/**
 * Wraps a route handler with consistent error handling.
 * Converts ApiError / ZodError into structured JSON responses.
 */
export function route<C extends Ctx = Ctx>(
  handler: (req: NextRequest, ctx: C) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, details: err.details ?? null }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
      }
      console.error('[api] unhandled error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/** Parse + validate a JSON request body against a zod schema. */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
  return schema.parse(raw);
}

/** Read and coerce pagination params (limit 1–200, default 50). */
export function pagination(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
  return { limit, offset };
}
