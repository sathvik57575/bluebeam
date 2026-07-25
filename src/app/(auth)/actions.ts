"use server";

import { lucia, validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  // const {session, user} = await validateRequest();
  const { session } = await validateRequest();
  if (!session) {
    // return {
    //     error: "Not authenticated to logout"
    // }
    //no need of human readable error here as the user should never try something like this in the first place

    throw new Error("Not authenticated to logout");
  }

  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/login");
}

//not using trycatch block here as there is not need of throwing human readable error messages, as the user should never try to logout without being authenticated in the first place. So we can just throw a generic error and let next.js handle it, which will result in a 500 error page, which is fine in this case. We only use trycatch block when we want to show human readable error messages to the user, like in login and signup actions, where we want to show specific error messages for different validation errors. In logout action, there is only one possible error, which is not being authenticated, so we can just throw a generic error and let next.js handle it.