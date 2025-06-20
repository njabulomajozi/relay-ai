import type { MiddlewareHandler } from 'hono';
import { createClient } from "@openauthjs/openauth/client";

declare module 'hono' {
  interface ContextVariableMap {
    
  }
}

type AuthMiddlewareOptions = {
    clientID: string;
    issuer: string;
    subjects: any
}

export const middleware = (options: AuthMiddlewareOptions): MiddlewareHandler => {
  return async (c, next) => {
    const { 
        clientID,
        issuer,
        subjects
     } = options;


     const client = createClient({
        clientID,
        issuer
    });

    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
        return c.text('Unauthorized', 401);
    }

    const token = authHeader.split(" ")[1];
    const verified = await client.verify(subjects, token);

    if (verified.err) {
        return c.text('Unauthorized', 401);
    }

    //  // Example: check for permissions
    //  if (!verified.permissions.includes('access-model')) {
    //     return c.text('Forbidden', 403);
    // }

    
    return await next();
  }
}