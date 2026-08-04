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

    await moderateText(content);

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
