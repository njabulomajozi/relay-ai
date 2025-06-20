import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Context, Next } from 'hono';
import { middleware } from '../../src/middlewares/hono/auth';

// Mock createClient from @openauthjs/openauth/client
vi.mock('@openauthjs/openauth/client', () => ({
  createClient: vi.fn(() => ({
    verify: vi.fn(async (_subjects, token) => {
      if (token === 'valid-token') return { err: null, permissions: ['access-model'] };
      return { err: 'Invalid token' };
    })
  }))
}));

describe('auth middleware', () => {
  const options = {
    clientID: 'test-client',
    issuer: 'https://issuer.example.com',
    subjects: ['user1']
  };
  let c: Partial<Context>;
  let next: Next;

  beforeEach(() => {
    c = {
      req: {
        header: vi.fn(),
        method: 'GET',
        url: '/test',
      },
      text: vi.fn((_msg, code) => ({ status: code, body: _msg })),
    } as any;
    next = vi.fn();
  });

  it('returns 401 if Authorization header is missing', async () => {
    expect(c.req).toBeDefined();
    (c.req!.header as any).mockReturnValue(undefined);
    const result = await middleware(options)(c as Context, next);
    expect(result).toEqual({ status: 401, body: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token is invalid', async () => {
    expect(c.req).toBeDefined();
    (c.req!.header as any).mockReturnValue('Bearer invalid-token');
    const result = await middleware(options)(c as Context, next);
    expect(result).toEqual({ status: 401, body: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next if token is valid', async () => {
    expect(c.req).toBeDefined();
    (c.req!.header as any).mockReturnValue('Bearer valid-token');
    await middleware(options)(c as Context, next);
    expect(next).toHaveBeenCalled();
  });
}); 