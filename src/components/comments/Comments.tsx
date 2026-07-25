import { CommentsPage, PostData } from "@/lib/types";
import CommentInput from "./CommentInput";
import { useInfiniteQuery } from "@tanstack/react-query";
import { kyInstance } from "@/lib/ky";
import Comment from "./Comment";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface CommentsProps {
    post: PostData
}

export default function Comments({post}: CommentsProps){

    const {
        data,
        hasNextPage, 
        fetchNextPage, 
        isFetching,
        status
    } = useInfiniteQuery({
        queryKey: ["comments", post.id],
        queryFn: ({pageParam})=>kyInstance.get(`/api/posts/${post.id}/comments`, pageParam ? {searchParams: {cursor: pageParam}}:{}).json<CommentsPage>(),
        initialPageParam: null as string | null,
        getNextPageParam: (firstPage)=> firstPage.previousCursor,

        //and then we reverse the data, just descried in docs
        select: (data)=> ({
            pages: [...data.pages].reverse(),
            pageParams: [...data.pageParams].reverse()
        }),
        /*
        we need to reverse data or else the order messes up. Prisma already sends them in the right order per page, but the pages array itself is in the wrong order.
        Each time we click "load previous", TanStack Query appends new pages to data.pages: (assume there are 13 comments with a pageSize=5)
        First load:  pages = [[C9-C13]]
        Load prev:   pages = [[C9-C13], [C4-C8]]
        Load prev:   pages = [[C9-C13], [C4-C8], [C1-C3]]
        When we render pages.flatMap(page => page.comments) without reversing, you get:
        C9 C10 C11 C12 C13 C4 C5 C6 C7 C8 C1 C2 C3, this is wrong order.
        So we reverse each time we get a new data from prisma
        First we get data=[[c9-c13]], stays the same after we reverse, so ignore this
        next when we press "load previous" tanstack query adds [c4-c8] to the data array, so data=[[c9-13], [c4-c8]], and now when we reverse it, we get [[c4-c8],[c9-c13]], so correct order.
        And then when we click "load previous" button again, tanstack query adds [c1-c3] again. so data = [[c9-c13],[c4-c8],[c1-c3]], and now when we reverse this we get [[c1-c3],[c4-c8],[c9-c13]], so correct order.
        Also remember that select(data) runs on the original data object, not on the already reversed data in the previous iteration. So select runs every time on the entire data object, not incrementally. So it always reverses the complete array from scratch.
        If it ran incrementally we would get wrong order in the 3rd page. Ex: [[c4-c8],[c9-c13]], and adding [c1-c3] here will be [[c4-c8],[c9-c13], [c1-c3]], and now if we reverse this we will get [[c1-c3],[c9-c13],[c4-c8]], so this is wrong order. Therefore select(data) runs on the original entire data object, and also point to remember the data object we destructure is different from the internal data object tanstack uses to keep original order.
        */
    })

    const comments = data?.pages.flatMap(page=>page.comments) || []

    return (
      <div className="space-y-3">
        <CommentInput post={post} />

        {hasNextPage && (
          <Button
            variant={"link"}
            className="mx-auto block cursor-pointer"
            disabled={isFetching}
            onClick={() => fetchNextPage()}
          >
            Load previous comments
          </Button>
        )}

        {status === "pending" && <Loader2 className="mx-auto animate-spin"/>}
        {status==="success" && comments.length==0 && (
            <p className="text-muted-foreground text-center">No comments yet</p>
        )}
        {status === "error" && (
            <p className="text-center text-destructive">And error occured while loading comments</p>
        )}

        <div className="divide-y">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    );
} 