'use server'

import { auth } from "@/lib/auth"

export async function signIn(email: string, password: string) {
    try {
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
        });
        return result;
    } catch (error) {
        throw error;
    }
}

export async function signUp(email: string, password: string, name: string) {
    try {
        if (!email || !password || !name) {
            throw new Error("Email, password and name are required");
        }
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });
        return result;
    } catch (error) {
        throw error;
    }
}