import { google, lucia } from "@/auth";
import { kyInstance } from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req:NextRequest) {
    const code = req.nextUrl.searchParams.get("code"); //getting code verifier
    const state = req.nextUrl.searchParams.get("state"); //getting state

    const storedState = (await cookies()).get("state")?.value;
    const storedCodeVerifier = (await cookies()).get("code_verifier")?.value;

    if(!code || !state || !storedState || !storedCodeVerifier || state!=storedState){
        return new Response(null, {status: 400})
    }


    try {
        const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

        const googleUser = await kyInstance.get("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`
            }
        })
        .json<{id: string, name: string}>();
        //there are other stuff like email, but we ignore it since if use login via google email should be empty

        const existingUser = await prisma.user.findUnique({
            where:{
                googleId: googleUser.id
            }
        })

        if(existingUser){
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            (await cookies()).set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes
            );

            return new Response(null, {
              status: 302,
              headers: { Location: "/" },
            });
        }

        //if google user already doesn't exist
        //do the same as we did in signup actions
         const userId = generateIdFromEntropySize(10);

         const username = slugify(googleUser.name) + "-" + userId.slice(0,4)

         //copied from signup actions(and changed the username, displayname and added googleId)
         await prisma.$transaction(async (tx) => {
           await tx.user.create({
             data: {
               id: userId,
               username,
               displayName: googleUser.name,
               googleId: googleUser.id
             },
           });

           await streamServerClient.upsertUser({
             id: userId,
             username,
             name: username,
           });
         });

         //then do the same, create session, cookie etc
         const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            (await cookies()).set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes
            );

            return new Response(null, {
              status: 302,
              headers: { Location: "/" },
            });


    } catch (error) {
        console.log(error);

        if (error instanceof OAuth2RequestError) {
            return new Response(null, {
            status: 400,
            });
        }

        return new Response(null, {
            status: 500,
        });
    }   
}