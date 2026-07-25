import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import prisma from "./lib/prisma";
import { Lucia, Session, User } from "lucia";
import { cache } from "react";
import { cookies } from "next/headers";
import {Google} from "arctic";

//just copied this from lucia/nextjs/app-router docs

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseSessionAttributes) {
    return {
      id: databaseSessionAttributes.id,
      username: databaseSessionAttributes.username,
      displayName: databaseSessionAttributes.displayName,
      avatarUrl: databaseSessionAttributes.avatarUrl,
      googleId: databaseSessionAttributes.googleId,
    };
  },
});

//changing the type in the lucia object itself, so that when we use lucia in other files, it already knows the shape of the user attributes. This is done by declaring a module augmentation for "lucia" and defining the Register interface to include our custom user attributes. Now, whenever we use lucia in our code, it will have the correct types for the user attributes without needing to redefine them each time. More explanation about this in info1.txt
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
}


//adding later for google Oauth
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`
)



export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    // 1. Get session ID from cookie
    const sessionId =
      (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    // 2. If no session cookie, user is not logged in
    if (!sessionId) return { 
            user: null, 
            session: null 
        };

    // 3. Validate the session against DB
    const result = await lucia.validateSession(sessionId);

    // next.js throws when you attempt to set cookie when rendering pages, so we catch it and ignore it. This is because the session cookie is only needed for client-side navigation, and not for server-side rendering.
    try {
      // 4. If session is fresh (recently validated), refresh the cookie, this way we make sure that user is always logged in.
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      // 5. If no valid session, clear the cookie
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {} // Next.js throws if you set cookies during page rendering, so we ignore it

    return result; // { user, session } or { user: null, session: null }
  },
);
