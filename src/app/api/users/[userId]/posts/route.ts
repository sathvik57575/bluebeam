import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest,{params} : {params: Promise<{userId: string}>}){
    try {
        const {userId} = await params;

        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
        
        const pageSize = 6;

        const {user} = await validateRequest();

        if(!user) return Response.json({error:"Unauthorized"}, {status:401})

        const posts = await prisma.post.findMany({
            // where:{
            //     user:{
            //         id: userId
            //     }
            // },
            //we can also write it like this but below is short and efficient

            // where: { userId:userIdResolved}, //we can't just do where: {userId}, since userId is a promise, we need to resolve it first. If we make userId a promise we can just do where:{userId} but since it gives us console error, we are doing this.
            where: {userId}, //later we found out we were extracting params wrong and corrected it, so we can just do where:{userId}

            include: getPostDataInclude(user.id),
            orderBy:{
                createdAt:"desc"
            },

            take: pageSize+1,
            cursor: cursor ? {id: cursor}: undefined
        })

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
