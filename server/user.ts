'use server';

import { auth } from '@/lib/auth';

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const result = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });
  return result;
}

export async function signUp(email: string, password: string, name: string) {
  if (!email || !password || !name) {
    throw new Error('Email, password and name are required');
  }
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });
  return result;
}
