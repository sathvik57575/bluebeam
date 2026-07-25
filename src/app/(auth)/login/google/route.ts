import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET(){
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);
    //we need to add semicolon(;) at the end or it will show error.
    
    /*
    or
    const scopes = ["openid", "profile"];
    const url = google.createAuthorizationUrl(state, codeVerifier, scopes);

    in previous versions of lucia/arctic we would have written scopes in an object

    const url = await google.createAuthorizationURL(state, codeVerifier, {
        scopes: ["profile", "email"],
    });
    */

    // store state as cookie
    (await cookies()).set("state", state, {
        secure: process.env.NODE_ENV==="production", // set to false in localhost, set to secure only in production
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10, // 10 min
        sameSite: "lax"
    });

    // store code verifier as cookie
    (await cookies()).set("code_verifier", codeVerifier, {
        secure: process.env.NODE_ENV==="production", // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10, // 10 min
        sameSite: "lax"
    });

    return Response.redirect(url);
}