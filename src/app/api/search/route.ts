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

        //getting the search query params
        const q = req.nextUrl.searchParams.get("q");

        //making it a string by replacing spaces with "&" so that prisma/postgress can search it, this is how it expects it. Just go to postgress/prisma docs for doubts.
        const searchQuery = q?.split(" ").join(" & ");

        //we are searching matching words for that query in the username, displayname of the users and also the posts content. So now even if the username/displayname match it will fetch the posts of those users.
        const posts = await prisma.post.findMany({
            where:{
                OR:[
                    {
                        content:{
                            search: searchQuery
                        }
                    },
                    {
                        user:{
                            displayName:{
                                search: searchQuery
                            }
                        }
                    },
                    {
                        user:{
                            username:{
                                search: searchQuery
                            }
                        }
                    }
                ]
            },

            include: getPostDataInclude(user.id),
            orderBy: {createdAt: "desc"},
            take: pageSize + 1,
            cursor: cursor? {id:cursor}: undefined

        })


        const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

 
        const data: PostsPage = {
            posts: posts.slice(0, pageSize),
            nextCursor
        }

        return Response.json(data);
        
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"}, {status:500})
    }
} 

