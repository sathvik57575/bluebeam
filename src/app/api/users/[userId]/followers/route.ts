import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { FollowerInfo } from "@/lib/types";


export async function GET(req: Request, 
    {params} : {params: Promise<{userId: string}>}
) {
    try {
        const {userId}= await params;

        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})

        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {
                followers:{
                    where:{
                        followerId: loggedInUser.id
                    },
                    select:{
                        followerId: true
                    }
                },
                _count:{
                    select:{
                        followers: true
                    }
                }
            }
        })

        if(!user) return Response.json({error: "User not found"}, {status: 404})

        
        const data: FollowerInfo = {
            followers: user._count.followers,
            isFollowedByUser: !!user.followers.length //or we can even do user.followers.length>0
        }

        return Response.json(data);

    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}



export async function POST(req: Request, 
    {params} : {params: Promise<{userId: string}>}
) {
    try {
        const {userId}= await params;

        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})

        //we are using upsert instead of create because if the user has already followed the other user and tries to follow again then create will throw an error because of unique constraint on followerId and followingId in the database but with upsert it will not throw an error and will simply do nothing because we are passing empty object in update. MORE EXPLANATION IN info4.txt
        /*
        await prisma.follow.upsert({
            where:{
                followerId_followingId: {
                    followerId: loggedInUser.id,
                    followingId: userId
                }
            },
            create:{
                followerId: loggedInUser.id,
                followingId: userId
            },
            update:{}
        })
        */

        //commenting it out later to add a transaction for creating notifications simultaneously. Here we don't need to check we're not the same user since we cannot follow ourselves in the first place lol.
        await prisma.$transaction([
            prisma.follow.upsert({
                where:{
                    followerId_followingId: {
                        followerId: loggedInUser.id,
                        followingId: userId
                    }
                },
                create:{
                    followerId: loggedInUser.id,
                    followingId: userId
                },
                update:{}
            }),

            prisma.notification.create({
                data:{
                    issuerId: loggedInUser.id,
                    recipientId: userId,
                    type: "FOLLOW",
                }
            })
        ])

        return new Response();
        
    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}



export async function DELETE(req: Request, 
    {params} : {params: Promise<{userId: string}>}
) {
    try {
        const {userId}= await params;
        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})

        /*
        await prisma.follow.deleteMany({
            where:{
                followerId: loggedInUser.id,
                followingId: userId
            }
        })
        */
       //commenting it out later to add a transaction for deleting notifications simultaneously.
       await prisma.$transaction([
            prisma.follow.deleteMany({
                where:{
                    followerId: loggedInUser.id,
                    followingId: userId
                }
            }),
            prisma.notification.deleteMany({
                where:{
                    issuerId: loggedInUser.id,
                    recipientId: userId,
                    type: "FOLLOW"
                }
            })
       ])

        return new Response();
        
    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}

/* Later we converted this into this
{params: {userId}} : {params: {userId: string}}
to 
{params: {userId}} : {params: {userId: Promise<string>}} and did const userIdResolved = await userId;
According to nextjs 15 docs, route handlers should accept params as promises. So we need to change the type of userId to Promise<string> and then resolve it by awaiting it. This is a new change in nextjs 15, in nextjs 14 we could just accept params as normal values without promises.
Even if we leave it like that it will work but it throw an error in the console because we are not following the new convention of accepting params as promises. So to fix that we need to change the type of userId to Promise<string> and then resolve it by awaiting it.

Error: Route "/api/users/[userId]/followers" used `params.userId`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at POST (src\app\api\users\[userId]\followers\route.ts:53:15)
  51 |
  52 | export async function POST(req: Request, 
> 53 |     {params: {userId}} : {params: {userId: Promise<string>}}
     |               ^
  54 | ) {
  55 |     try {
  56 |         const userIdResolved= await userId;


OK so small correction, I found out that the error is still happening, and I found out the reason in STACK OVERFLOW. We were previously doing  
{params: {userId}} : {params: {userId: Promise<string>}}
and 
const userIdResolved = await userId; (still works but gives error)

but the correct way is {params} : {params: Promise<{userId: string}>}
and then do 
const {userId} = await params;

So the tutor was doing this because he was on nextjs 14
{params: {userId}} : {params: {userId: string}}
We initially changed it to {params: {userId}} : {params: {userId: Promise<string>}} which is still wrong
the correct way is {params} : {params: Promise<{userId: string}>}

This is because the entire params object is a promise, not just the userId property. So we need to await the entire params object and then destructure the userId from it. This is a new change in nextjs 15, in nextjs 14 we could just accept params as normal values without promises. Even if we leave it like that it will work but it throw an error in the console because we are not following the new convention of accepting params as promises. So to fix that we need to change the type of params to Promise<{userId: string}> and then resolve it by awaiting it and destructuring userId from it.
*/