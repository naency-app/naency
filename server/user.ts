'use server'

import { auth } from "@/lib/auth"

export async function signIn(email: string, password: string) {
    await auth.api.signInEmail({
        body: {
            email,
            password,
        },
    })
}

export async function signUp(email: string, password: string, name: string) {
  await auth.api.signUpEmail({
      body: {
          email,
          password,
          name,
      },
  })
}