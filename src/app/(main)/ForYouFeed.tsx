/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import DeletePostDialogue from "@/components/posts/DeletePostDialogue";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { Button } from "@/components/ui/button";
import { kyInstance } from "@/lib/ky";
import { PostData, PostsPage } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";


export default function ForYouFeed(){

    /*
    const query = useQuery<PostData[]>({
        queryKey:["post-feed", "for-you"],

        /* //commented out the fetch code because we are using ky instead of fetch
        queryFn: async ()=>{
            const res = await fetch("/api/posts/for-you");
            if(!res.ok){
                throw new Error(`Request failed with status code ${res.status}`)
            }
            return res.json()
        }
         

        //we are using ky instead of fetch, because ky has built in error handling and it throws an error if the response is not ok, so we don't have to check for res.ok and throw an error ourselves, ky does it for us. Also ky has built in support for json, so we can just call res.json() without having to check the content type of the response, ky will automatically parse the response as json if the content type is application/json. We are also changing the createdAt field to a Date object, so we can use it in the Post.tsx component correctly. We explained that in info3.tsx and in lib/ky.ts file

        queryFn: kyInstance.get("api/posts/for-you").json<PostData[]> 
        
        //we can even skip writing PostData[], and just do kyInstance.get(...).json and it will infer the type from the queryFn return type, but I like to be explicit about the types, so I prefer to write it like this. Also this way we can easily see what type of data is being returned from the queryFn without having to hover over it or go to the kyInstance definition to see what it returns.
    })

    */

    //in future I am implenting infinite loading, so I am commenting out the useQuery code. We will use the useInfiniteQuery hook, there are some differences, go read docs. useInfiniteQuery is below.

    const {
        data,
        fetchNextPage,
        isFetching,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey:["post-feed", "for-you"],
        queryFn: ({pageParam}) => {
            return kyInstance.get("/api/posts/for-you", 
                pageParam ? {searchParams: {cursor: pageParam}} : {}
            ).json<PostsPage>()
        },
        initialPageParam: null as string | null,
        getNextPageParam: (previousPage) => previousPage.nextCursor
    })

    

    //now data is an array of post pages, not just posts, so we have to flat the data to get an array of posts, we can do that with data.pages.flatMap(page => page.posts). I explained this in info3.txt file
    const posts = data?.pages.flatMap(page => page.posts) ?? []
    /*
    same as doing
    const pages = data?.pages.map(page=>page.posts) ?? [];
    const posts = pages.flat();
    */


    if(status === "pending"){
        // return <Loader2 className="mx-auto animate-spin"/>
        return <PostsLoadingSkeleton/>
    }

    //if we successfully did an api call but there are no posts yet
    if(status === "success" && posts.length === 0 && !hasNextPage){
        return <p className="text-center text-muted-foreground">No one has posted anything yet, be the first to post!</p>
    }

    if(status === "error"){
        return <p className="text-center text-destructive">An Error occurred while loading posts</p>
    }

    return (
        
        // <div className="space-y-5"> 
        // {/* don't use a div to wrap the posts, just use <>, because if we use div, it will mess up the styling as we have to add gap between divs as gap between posts doesn't apply. If we use just </> this ForYouFeed.tsx component will return and render individual posts on the screen not wrapped in any div. SO space-y-5 from (main)/page.tsx applies and posts are spaced correctly */}
        // {/* edit: so later I had to change this back to div since I am trying to implement infinite loading, so we have to wrap this in something anyway lol, so I am wrapping this in div right now and giving it a styling of space-y-5 to add gap between individual posts */}

        //     {posts.map(post=>(
        //         <Post key={post.id} post={post}/>
        //     ))}

        //     {/* this button is used to load the next page of posts when it is pressed, we will replace in the future  */}
        //     {hasNextPage && (
        //         <Button onClick={()=>fetchNextPage()}>Load more</Button>
        //     )}
        // </div>

        <InfiniteScrollContainer onBottomReached={()=> hasNextPage && !isFetching && fetchNextPage()} className="space-y-5">
            {posts.map(post=>(
               <Post key={post.id} post={post}/>
             ))}

             {isFetchingNextPage && (
                <Loader2 className="mx-auto animate-spin"/>
             )}

             {/* <DeletePostDialogue open onClose={()=>{}} post={posts[0]}/> 
             
             added this to see the delete dialogue box, commenting this out later
             */}
        </InfiniteScrollContainer>
        
    )
}


