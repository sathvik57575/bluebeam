"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { kyInstance } from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";


interface UserPostsProps{
    userId: string
}


export default function UserPosts({userId}: UserPostsProps){

    const {
        data,
        fetchNextPage,
        isFetching,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey:["post-feed", "user-posts", userId],
        queryFn: ({pageParam}) => {
            return kyInstance.get(`/api/users/${userId}/posts`,  //don't forget / before api, otherwise it will be treated as a relative path and we will get an error saying "GET http://localhost:3000/current/api/users/123/posts 404 (Not Found)"
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
        return <p className="text-center text-muted-foreground mt-8">This user hasn&apos;t posted anything yet</p>
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


