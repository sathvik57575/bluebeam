"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { kyInstance } from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function RecommendedFeed() {
  const { user } = useSession();
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["post-feed", "recommended", user.id],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/posts/recommended", pageParam ? { searchParams: { cursor: pageParam } } : {})
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (previousPage) => previousPage.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (status === "pending") return <PostsLoadingSkeleton />;
  if (status === "error") return <p className="text-center text-destructive">An error occurred while loading recommendations.</p>;
  if (posts.length === 0 && !hasNextPage) return <p className="mt-8 text-center text-muted-foreground">No recommended posts are available yet. Create or import more posts with embeddings to grow this feed.</p>;

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => <Post key={post.id} post={post} />)}
      {isFetchingNextPage && <Loader2 className="mx-auto animate-spin" />}
    </InfiniteScrollContainer>
  );
}
