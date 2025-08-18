// lib/auth-client.ts

import { jwtClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  plugins: [jwtClient()],
  onError: (error: unknown) => {
    console.error('Auth Client Error:', error);
  },
});

export default authClient;
