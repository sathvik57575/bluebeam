"use server"

import { validateRequest } from "@/auth"
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
import { generateAndStorePostEmbedding } from "@/lib/semantic-search";
import { moderateText } from "@/lib/moderation";
// import { revalidatePath } from "next/cache";

export async function submitPost(input:{
    content: string,
    mediaIds: string[]
}) {

    const {user} = await validateRequest(); //will be cached per request

    if(!user) throw Error("Unauthorized") //this doesn't need to be user readable as user shouldn't try to submit a post without being logged in, as he will be redeirected, so this is only if he tries to do something funny

    // const {content} = createPostSchema.parse({content:input});
    const {content, mediaIds} = createPostSchema.parse(input); //just passing the whole input object since the key names are correctly recieved anyway

    try {
      await moderateText(content);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Content violates moderation policy. Please remove explicit language and try again.",
      };
    }

    const newPost = await prisma.post.create({
        data:{
            content,
            userId: user.id,

            //adding this later
            attachments: {
                connect: mediaIds.map(id => ({id}))
                /*
                    think of it like this
                    connect: mediaIds.map((id)=>{
                        return {id: id}
                    })
                    
                    connect expects a syntax like id: mediaId, we need the keyword id.
                    If we want to connect just one mediaId we do 
                    connect: {id: mediaId}
                    for connecting an array of ids we do
                    connect: [{id: mediaId1}, {id: mediaId2}, {id: mediaId3}]

                    more about connect in the info6.txt file
                */
            }
        },
        // include:postDataInclude
        include: getPostDataInclude(user.id)
    })

    // Embeddings improve search, but a Gemini outage must never delay publishing.
    void generateAndStorePostEmbedding(newPost.id, newPost.content);

    // revalidatePath("/posts") //revalidating the posts page, so that the new post appears without refreshing the page. But we're not using this since our posts are client component, so they will update automatically when the state changes, so we don't need to revalidate the page. Also we will use react query to manage the posts state, so we will just invalidate the query instead of revalidating the page.

    return newPost;
}

/*
Previously we were only having the content input, later I updated to even have media attachments. This is the code before media attachments.

export async function submitPost(input:string) {

    const {user} = await validateRequest(); //will be cached per request

    if(!user) throw Error("Unauthorized") //this doesn't need to be user readable as user shouldn't try to submit a post without being logged in, as he will be redeirected, so this is only if he tries to do something funny

    const {content} = createPostSchema.parse({content:input});

    const newPost = await prisma.post.create({
        data:{
            content,
            userId: user.id
        },
        // include:postDataInclude
        include: getPostDataInclude(user.id)
    })

    // revalidatePath("/posts") //revalidating the posts page, so that the new post appears without refreshing the page. But we're not using this since our posts are client component, so they will update automatically when the state changes, so we don't need to revalidate the page. Also we will use react query to manage the posts state, so we will just invalidate the query instead of revalidating the page.

    return newPost;
}

*/


/**
 We did AI content moderation
 previously it was just 
 await moderateText(content);
 later we wrapped it in a try/catch and returned a proper object in case error occurs so we can handle it on the client side.
 Before we did this try/catch, if the profanity check fails, an error is thrown in this server action file itself, In a server action, if an error is thrown and not caught, Next.js treats it as a server-side failure. That unhandled exception is logged in the terminal and also causes the request to fail. Everything will work fine even in this case(our server won't crash), it just means one request failed, and it continues listening to next request.
 But one problem is nextjs deliberately strips any error messages thrown inside the server action, replacing it with that generic "error occurred in Server Components render" text + a digest. In our app when user types any profane word and tries to submit, then in development a proper error toast message is shown, but in production a generic error message is displayed as shown above. So to fix this, The fix: don't throw from the Server Action for expected, user-facing errors — return a result object instead, and throw on the client side, since client-thrown errors are never touched by this sanitization (it only applies to code executing in the server action context), in the actions.ts file we already wrapped the await moderateText(content) in a try/catch so it throws error, and it returns an object response with success field(we later removed this success field) and err field. and that we will handle that error here in the client side(mutations.ts file).

 SO in this case no error is displayed in the terminal when we try to submit a profane word since we wrapped "await moderateText(content)" in a try/catch and handled the error and returned an object, so now there is no error(unhandled error) which is thrown in the server action which will cause a request to fail and be logged in the terminal. Now the request will succeed, but the result will be an object with error field which we will handle in the client side(mutations.ts file) and show a proper toast message to the user. The thrown error is now caught inside the server action, so it never bubbles up as an unhandled server exception.

 
 */