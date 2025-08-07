import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
 
export async function middleware(request: NextRequest) {
    try {
        const sessionCookie = getSessionCookie(request);
        
        // THIS IS NOT SECURE!
        // This is the recommended approach to optimistically redirect users
        // We recommend handling auth checks in each page/route
        if (!sessionCookie) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        
        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        // In case of error, redirect to login for safety
        return NextResponse.redirect(new URL("/login", request.url));
    }
}
 
export const config = {
    matcher: ["/dashboard"], // Specify the routes the middleware applies to
};