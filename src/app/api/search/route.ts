import { validateRequest } from "@/auth";
import { hybridSearchPosts } from "@/lib/semantic-search";
import { PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

function withoutMatchType<T extends { matchType: unknown }>({ matchType, ...post }: T): Omit<T, "matchType"> {
    void matchType;
    return post;
}

export async function GET(req: NextRequest){
    try {
        const cursor = req.nextUrl.searchParams.get("cursor");
        
        const pageSize = 6;

        const {user} = await validateRequest();

        if(!user) return Response.json({error:"Unauthorized"}, {status:401})

        //getting the search query params
        const q = req.nextUrl.searchParams.get("q");

        const results = q ? await hybridSearchPosts(q, user.id) : [];
        const offset = Math.max(0, Number.parseInt(cursor ?? "0", 10) || 0);
        const posts = results.slice(offset, offset + pageSize + 1);
        const nextCursor = posts.length > pageSize ? String(offset + pageSize) : null;

 
        const data: PostsPage = {
            // Keep the response consumed by the existing UI unchanged.
            posts: posts.slice(0, pageSize).map(withoutMatchType),
            nextCursor
        }

        return Response.json(data);
        
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"}, {status:500})
    }
} 

