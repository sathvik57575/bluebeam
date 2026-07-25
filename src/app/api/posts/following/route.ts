import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest){
    try {

        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
        
        const pageSize = 6;

        const {user} = await validateRequest();

        if(!user) return Response.json({error:"Unauthorized"}, {status:401})

        const posts = await prisma.post.findMany({

            //this is the only thing different from for-you/route.ts. We're checking if the post's author is being followerd by the currently logged in user. We're doing that by checking the followers array of the author of the post, and seeing if we can find an entry where the followerId is the id of the currently logged in user. That is why we're using some:{}. This checks if at least ONE record matches the condition "Is there at least one follower..." Where that follower's ID equals the current user's ID "...that matches the current user?"
            where:{
                user:{
                    followers:{
                        some:{
                            followerId: user.id
                        }
                    }
                }
            },

            include: getPostDataInclude(user.id),
            orderBy:{
                createdAt:"desc"
            },

            take: pageSize+1,
            cursor: cursor ? {id: cursor}: undefined
        })

        /*
        //printing sample stuff to see shape of data for some doubts, commenting out later
        console.log(posts[0]); 
        const bob = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                followers: true,    // All Follow records where followingId = bob-id
                following: true     // All Follow records where followerId = bob-id
            }
        })
        console.log(bob);
        */

        const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

        const data: PostsPage = {
            posts: posts.slice(0, pageSize),
            nextCursor
        }

        // return Response.json(posts);
        return Response.json(data);
        
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"}, {status:500})
    }
} 
