// import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

export async function POST(req: Request) {
  try {
    // const { user } = await validateRequest();

    // if(!user) {
    //     return Response.json({ error: "Unauthorized" }, { status: 401 });
    // }
    //the user verification is not needed here since this is a cron job done by vercel, so we will use a secret key to verify the request instead of user verification. If we do user verification it will give error since the cron job is not done by a user, so we will use a secret key to verify the request instead of user verification.

    const authHeader = req.headers.get("Authorization");

    if(authHeader !== `Bearer ${process.env.CRON_SECRET}`){
        return Response.json({error: "Invalid Authorization header"}, {status: 401})
    }

    //clear the media uploads where the postId = null
    //here we cannot use deleteMany instead of findMany and delete it right here, since deleteMany doesn't have select condition, where we can select what fields to return. It will simply delete. So to get the urls and id's we need to first fetch all the objects in media DB where postId=null. Using the url we will delete the files in the UploadThing, and then using the id's we will delete the files in the DB below using deleteMany.
    const unusedMedia = await prisma.media.findMany({
        where:{
            postId: null,
            ...(process.env.NODE_ENV === "production" ? {
                createdAt: {
                    lte: new Date(Date.now() - 1000 * 60 * 60 * 24)
                }
            }:{}),
        },

        select:{
            id:true,
            url:true
        }
    })

    new UTApi().deleteFiles(
        unusedMedia.map(media => media.url.split("f/")[1])
    )

    await prisma.media.deleteMany({
        where:{
            id: {
                in: unusedMedia.map(m=>m.id)
            }
        }
    })

    return Response.json({message: "Unused media cleared successfully", deletedCount: unusedMedia.length}, {status: 200});

  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
