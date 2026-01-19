// Input validation utilities for API routes

import { z } from 'zod';

// Common validation patterns
export const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithDash: /^[a-zA-Z0-9_-]+$/,
  stockSymbol: /^[A-Z]{1,5}$/,
  dateISO: /^\d{4}-\d{2}-\d{2}$/,
};

// Common Zod schemas
export const schemas = {
  uuid: z.string().regex(patterns.uuid, 'Invalid UUID format'),

  stockSymbol: z.string().regex(patterns.stockSymbol, 'Invalid stock symbol'),

  tag: z.string()
    .min(1, 'Tag cannot be empty')
    .max(50, 'Tag too long')
    .regex(patterns.alphanumericWithDash, 'Tag can only contain letters, numbers, underscores, and dashes'),

  dateISO: z.string().regex(patterns.dateISO, 'Invalid date format (YYYY-MM-DD)'),

  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  strategyType: z.enum([
    'cash_secured_put',
    'covered_call',
    'put_credit_spread',
    'call_credit_spread',
  ]),

  tradeStatus: z.enum([
    'candidate',
    'approved',
    'executed',
    'expired',
    'rejected',
  ]),

  journalEntryType: z.enum([
    'trade_reflection',
    'daily_review',
    'lesson_learned',
    'market_observation',
  ]),

  mood: z.enum(['confident', 'neutral', 'anxious', 'frustrated']),

  positionStatus: z.enum(['open', 'closed']),

  orderAction: z.enum([
    'buy_to_open',
    'sell_to_open',
    'buy_to_close',
    'sell_to_close',
  ]),

  orderType: z.enum(['limit', 'market']),
};

// Validation helpers
export function validateUUID(value: string): boolean {
  return patterns.uuid.test(value);
}

export function validateStockSymbol(value: string): boolean {
  return patterns.stockSymbol.test(value.toUpperCase());
}

export function validateTag(value: string): boolean {
  return patterns.alphanumericWithDash.test(value) && value.length <= 50;
}

export function sanitizeString(value: string, maxLength: number = 1000): string {
  return value.trim().slice(0, maxLength);
}

// Parse and validate request body
export async function parseBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> | null; error: string | null }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { data: null, error: errors.join(', ') };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: 'Invalid JSON body' };
  }
}

// Parse and validate query params
export function parseQuery<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T> | null; error: string | null } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return { data: null, error: errors.join(', ') };
  }

  return { data: result.data, error: null };
}

// Timing-safe string comparison for secrets
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
