'use server'

import { auth } from "@/lib/auth"

export async function signIn(email: string, password: string) {
    try {
        console.log("Attempting to sign in user:", email);
        
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
        });
        
        console.log("Sign in successful for:", email);
        return result;
    } catch (error) {
        console.error("Sign in error:", error);
        
        // Log more details about the error
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        
        throw error;
    }
}

export async function signUp(email: string, password: string, name: string) {
    try {
        console.log("Attempting to sign up user:", { email, name });
        
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
        
        console.log("Sign up successful for:", email);
        return result;
    } catch (error) {
        console.error("Sign up error:", error);
        
        // Log more details about the error
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        
        throw error;
    }
}