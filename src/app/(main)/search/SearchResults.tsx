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


//adding this
interface SearchResultsProps{
    query: string
}


export default function SearchResults({query}:SearchResultsProps){

    const {
      data,
      fetchNextPage,
      isFetching,
      hasNextPage,
      isFetchingNextPage,
      status,
    } = useInfiniteQuery({
      queryKey: ["post-feed", "search", query],
      queryFn: ({ pageParam }) => {
        return kyInstance
          .get(
            "/api/search/",
            {
                searchParams:{
                    q: query,
                    ...(pageParam? {cursor: pageParam}:{})
                }
            }
          )
          .json<PostsPage>();
      },
      initialPageParam: null as string | null,
      getNextPageParam: (previousPage) => previousPage.nextCursor,
      gcTime: 0, // Disable garbage collection for this query, so always fresh data is fetched when the query is invalidated. This is important for search results, as we want to always show the latest results for a given query.
    });

    
    const posts = data?.pages.flatMap(page => page.posts) ?? []


    if(status === "pending"){
        return <PostsLoadingSkeleton/>
    }

    if(status === "success" && posts.length === 0 && !hasNextPage){
        return <p className="text-center text-muted-foreground">No posts found for this query.</p>
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


