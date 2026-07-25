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


export default function Bookmarks(){

    const {
        data,
        fetchNextPage,
        isFetching,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey:["post-feed", "bookmarks"],
        queryFn: ({pageParam}) => {
            return kyInstance.get("/api/posts/bookmarked", 
                pageParam ? {searchParams: {cursor: pageParam}} : {}
            ).json<PostsPage>()
        },
        initialPageParam: null as string | null,
        getNextPageParam: (previousPage) => previousPage.nextCursor
    })

    
    const posts = data?.pages.flatMap(page => page.posts) ?? []


    if(status === "pending"){
        return <PostsLoadingSkeleton/>
    }

    if(status === "success" && posts.length === 0 && !hasNextPage){
        return <p className="text-center text-muted-foreground">You don&apos;t have any bookmarks yet</p>
    }

    if(status === "error"){
        return <p className="text-center text-destructive">An Error occurred while loading bookmarks</p>
    }

    return (
        <InfiniteScrollContainer onBottomReached={()=> hasNextPage && !isFetching && fetchNextPage()} className="space-y-5">
            {posts.map(post=>(
               <Post key={post.id} post={post}/>
             ))}

             {isFetchingNextPage && (
                <Loader2 className="mx-auto animate-spin"/>
             )}
        </InfiniteScrollContainer>
        
    )
}


