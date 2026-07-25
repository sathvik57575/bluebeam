"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signup(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    //validations
    const { username, email, password } = signUpSchema.parse(credentials);
    /*
        if (!result.success) {
            return {
                error: result.error.issues[0].message
            };
        }   
        we're doing this specific validation on frontend instead. In the backend also we must do some validation, we must since user can send info using postman. But if we get an error, we will throw an generic error message in catch block instead of specifying what validation went wrong. SINCE most users signup using a signup form on browser instead of POSTMAN. But we can do it like above if we want to instead of throwing and catching error.
    */

    //just copied from lucia docs, hashing the password before storing it in DB.
    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    //generate userId
    const userId = generateIdFromEntropySize(10);

    //check if user with the credentials already exists
    const usernameExists = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive", //even checks for case insensitive matches. SO matches apple and APPle
        },
      },
    });

    if (usernameExists) {
      return {
        error: "Username already exists",
      };
    }

    const emailExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (emailExists) {
      return {
        error: "Email already exists",
      };
    }

    /*
    //creating user in DB
    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
      },
    });

    //adding later or creating a stream user
    await streamServerClient.upsertUser({
      id: userId,
      username, 
      name: username //initially we set displayname as the username itself
      //and we don't have any avartarurl yet
    })
    */

    await prisma.$transaction(async (tx)=>{
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
    });

      await streamServerClient.upsertUser({
        id: userId,
        username, 
        name: username 
      })
    })

    //HERE tx is a prisma client itself. If any operation fails, that is throws error, then the succeeded operations is rolled back. Here if the prisma DB operaton fails, then the stream call is not executed, and if the prisma succeeds and stream call fails, then the succeeded prisma is rolled back too.


    //creating a session, cookie, so we can immediately login after signup and redirect to '/' page
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    //adding this later because we realized even redirect throws an error in next.js server actions, so we catch it and ignore it, since the redirect still works. This is because next.js server actions run on the server, and when you call redirect, it throws an error to stop the execution of the function and perform the redirect. So we catch that error and ignore it, since it's expected behavior. This happens because Next.js implements redirects by throwing an internal error. Don't know why.This line prevents catching it as a normal error. 
    if (isRedirectError(error)) throw error;

    console.log(error);
    return {
      error: "Something went wrong, Please try again",
    };
  }
}
