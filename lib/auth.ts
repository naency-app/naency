// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { jwt } from 'better-auth/plugins';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: false,
    allowUnverifiedLogin: true, // Allow login without email verification
  },
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    jwt({
      jwt: {
        issuer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        audience: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  onError: (error: unknown) => {
    console.error('Better Auth Error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  },
  // Add development-specific settings
  ...(process.env.NODE_ENV === 'development' && {
    debug: true,
  }),
});
