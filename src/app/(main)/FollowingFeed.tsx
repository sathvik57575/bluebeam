"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { kyInstance } from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";


export default function FollowingFeed(){

    const {
        data,
        fetchNextPage,
        isFetching,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey:["post-feed", "following"],
        queryFn: ({pageParam}) => {
            return kyInstance.get("/api/posts/following", 
                pageParam ? {searchParams: {cursor: pageParam}} : {}
            ).json<PostsPage>()
        },
        initialPageParam: null as string | null,
        getNextPageParam: (previousPage) => previousPage.nextCursor
    })

    const posts = data?.pages.flatMap(page => page.posts) ?? []

    if(status === "pending"){
        // return <Loader2 className="mx-auto animate-spin"/>
        return <PostsLoadingSkeleton/>
    }

    //if we successfully did an api call but there are no posts yet
    if(status === "success" && posts.length === 0 && !hasNextPage){
        return <p className="text-center text-muted-foreground mt-8">Oops, No posts found! Start following people to see their posts</p>
    }

    if(status === "error"){
        return <p className="text-center text-destructive">An Error occurred while loading posts</p>
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


