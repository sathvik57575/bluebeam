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
            // include:postDataInclude,
            include: getPostDataInclude(user.id),
            orderBy:{
                createdAt:"desc"
            },

            //added later
            take: pageSize+1,
            cursor: cursor ? {id: cursor}: undefined
            /* 
            Prisma expects this shape for cursors
            cursor: { id: "abc123" }
            doing just cursor: "abc123" will not work
            */
        })

        const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

        const data: PostsPage = {
            posts: posts.slice(0, pageSize), 
            nextCursor
        }
        //if the number of posts is less than the pagesize then all the posts are returned. undefined or null are not returned. arr.slice() works like this when slicing endpoint number exceeds arr.length
        //[1,2,3,4,5,6].slice(0,7) = [1,2,3,4,5,6], it won't add extra null or empty values

        // return Response.json(posts);
        return Response.json(data);
        
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"}, {status:500})
    }
} 

/*
So we retrieve pageSize+1(6+1= 7) posts, since we need to know and send the next cursor too. And we can even set from ehich id we wanna retrieve them from. Prisma has a cursor field. I explained the syntax above. SO basically it will only retrieve posts from that post id. So first it will sort all posts by descending order based on createdAt, and choose 7 posts from the post we want. So if we have 20 posts ordered by  and the cursor field is for the post 11, we will get posts from 11 - 17. 

And then we send the nextCursor to the frontend. We create a PostsPage data type in lib/types.ts, it's basically posts + nextCursor. 
And when selecting nextCursor we first check the posts.length. So let's say we have 10 posts in total. We retrieved first 7 the first time we got a request. Now we only need to send 6 posts to the frontend, the 7th post is retrieved for it's id to be used as a nextCursor, so we will send it's id to the frontend as the nextCursor.
So that is why we did 
const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;
So now since posts.length = 7, which is > pageSize(6), out nextCursor will be id of the last(7th) post. 
Now let's say the user scrolls down after 6 posts and then requests again for additional posts. He sends the cursor to us. It is the id of post 7. We have total 10 posts in our DB. Now we will retrieve 6+1=7 posts from DB again, starting from post 7. SO 7, 8, 9, 10. And since we don't 7 posts, we only get 4. So now posts array will only have 4 posts. So posts.length = 4. Now when we are calculating the value of nextCursor to send along with these 4 posts, we use the same formula
const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;
since posts.length(4) < pageSize(6), nextCursor = null
So we will send null as nextCursor to the frontend which means we don't have anymore posts to send and the user can stop scrolling.
I mean logic bruh, if we retrieve more than pageSize number of posts from the DB in a call, then it means there is still at least one posts left that should be sent to the frontend in the next request(in the current request we will send posts.length-1 posts). But if posts.length is <= pageSize it means we have retrieved all the posts from the DB. Since we tried to retrieve pageSize + 1 posts and only got <= pageSize posts, it means there are no more posts left to retrieve. So now there is no more need to scroll. So we send nextCursor as null, which indicates on the frontend there are no more posts left to retrieve and the loading symbol when we scroll disappears. 
*/