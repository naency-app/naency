import { betterAuth} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }), 
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: false,
    allowUnverifiedLogin: true, // Allow login without email verification
  },
  socialProviders: {
    google: {
      prompt: "select_account", 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    },
  },
  plugins: [nextCookies(), jwt({
    jwt: {
      issuer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      audience: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    
  }),],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  onError: (error: unknown) => {
    console.error("Better Auth Error:", error);
  },
  // Add development-specific settings
  ...(process.env.NODE_ENV === "development" && {
    debug: true,
  }),
});
