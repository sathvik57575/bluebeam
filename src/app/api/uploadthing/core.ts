import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import {createUploadthing, FileRouter} from "uploadthing/next";
import {UploadThingError, UTApi} from "uploadthing/server"

const f = createUploadthing();

export const fileRouter = {
    avatar: f({
        image:{ maxFileSize:"2MB"}
    })
    .middleware(async ()=>{
        console.log("Middleware reached for avatar upload");
        const {user} = await validateRequest();

        if(!user) throw new UploadThingError("Unauthorized");

        return {user};
    })
    .onUploadComplete(async ({metadata, file})=>{
        console.log("completed");

        //adding this later to avoid multiple files, we are deleting the old avatar in uploadthing server if user uploads a new one since a user should have only one avatar
        const oldAvatarUrl = metadata.user.avatarUrl;
        
        if(oldAvatarUrl){
            const key = oldAvatarUrl.split("f/")[1];
            await new UTApi().deleteFiles(key)
        }

        console.log("file successfully uploaded for user", metadata.user.username);

        console.log("file-url:" , file.ufsUrl);

        /*
        commenting this out because we're wrapping this into a Promise.all() along with stream update call to save time.

        await prisma.user.update({
            where:{
                id: metadata.user.id
            },
            data:{
                avatarUrl: file.ufsUrl
            }
        })
        */

        //here we don't need a transaction to wrap the stream call because the avatar file is already uploaded, and even if the stream call fails, we don't want to remove it. And even if the stream call fails here, we will see the avatar next time we connect to the chat. So we can wrap it into a Promise.all

        await Promise.all([
            await prisma.user.update({
                where:{
                    id: metadata.user.id
                },
                data:{
                    avatarUrl: file.ufsUrl
                }
            }),

            streamServerClient.partialUpdateUser({
                id: metadata.user.id,
                set:{
                    image: file.ufsUrl
                }
            })
        ])

        return {avatarUrl: file.ufsUrl}
    }),


    attachment: f({
        image: {maxFileSize: "4MB", maxFileCount: 5},
        video: {maxFileSize: "64MB", maxFileCount: 5}
    })
    .middleware(async ()=>{
        console.log("Middleware reached for media upload");
        const {user} = await validateRequest();

        if(!user) throw new UploadThingError("Unauthorized");

        return {}; //we don't need to return anything here
    })
    .onUploadComplete(async ({file})=>{
        console.log("media upload completed");

        const media = await prisma.media.create({
            data: {
                url: file.ufsUrl,
                type: file.type.startsWith("image") ? "IMAGE" : "VIDEO"
            }
        })

        //whatever we return here will be returned to the frontend.
        // When we send the post too on frontend, we need the attach the media to this post, TO set media we need the mediaId, so we are returning it here. So we return this to the frontend for each upload.
        return {mediaId: media.id}
    })
} satisfies FileRouter;

export type appFileRouter = typeof fileRouter;