import { InfiniteData, QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment, submitComment } from "./actions";
import { CommentsPage } from "@/lib/types";
import { toast } from "sonner";


export function useSubmitCommentMutation(postId: string){
    const queryClient = useQueryClient();

    const mutation = useMutation({
      // mutationFn: submitComment, //commenting out for the same reason we commented out the submitPost mutationFn in the editor/mutations.ts file, explained there in detail

      mutationFn: async (input: Parameters<typeof submitComment>[0]) => {
        const result = await submitComment(input);
        if ("error" in result) {
          throw new Error(result.error); // thrown client-side, not sanitized by nextjs
        }
        return result;
      },

      onSuccess: async (newComment) => {
        const queryKey: QueryKey = ["comments", postId];

        await queryClient.cancelQueries({ queryKey });

        queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
          queryKey,

          (oldData) => {
            const firstPage = oldData?.pages[0];

            if (firstPage) {
              return {
                pageParams: oldData.pageParams,
                pages: [
                  {
                    previousCursor: firstPage.previousCursor,
                    comments: [...firstPage.comments, newComment],
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            }
          },
        );

        queryClient.invalidateQueries({
          queryKey,
          predicate(query) {
            return !query.state.data;
          },
        });

        toast.success("Comment created");
      },
      onError(error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to submit comment. Please try again.";
        toast.error(message);
      },
    });

    return mutation;
}



export function useDeleteCommentMutation(){
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: deleteComment,

        onSuccess: async (deletedComment)=>{
            const queryKey: QueryKey = ["comments", deletedComment.postId];

            await queryClient.cancelQueries({queryKey});

            queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
                queryKey,

                (oldData)=>{
                    if(!oldData) return;
                    
                    return {
                        pageParams: oldData.pageParams,
                        pages: oldData.pages.map((page) => ({
                            previousCursor: page.previousCursor,
                            comments: page.comments.filter(c=>c.id!==deletedComment.id)
                        }))
                    }
                }
            )

            toast.success("Comment deleted")
        },
        onError(error){
            console.log(error);
            toast.error("Failed to delete comment. Please try again.")
        }
    })

    return mutation;
}