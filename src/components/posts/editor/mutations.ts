import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { submitPost } from "./actions";
import { PostsPage } from "@/lib/types";
import { useSession } from "@/app/(main)/SessionProvider";


export function useSubmitPostMutation(){

    const {user} = useSession();

    const queryClient = useQueryClient();

    const mutation = useMutation({
      mutationFn: submitPost,

      onSuccess: async (newPost) => {
        //this is a simpler way, just re-fetch/invalidate queries, NOTE: order of query keys matters too, we can't just write only post-feed or only for-you or in the wrong order ["for-you", "post-feed"]
          // queryClient.invalidateQueries({queryKey: ["post-feed", "for-you"]})
        //we are not doing this because we have to do a server request and then re-fetch all the pages loaded until that point, so it's takes up a lot of time and memory and server calls, especially if there are a lot of pages already loaded.

        //but cache mutation is a bit difficult to implement, but it's faster and more optimal for good user experience
        //we will do cache mutation here.

        /*
        previously we did this
        const queryFilter: QueryFilters = {
          queryKey: ["post-feed", "for-you"],
        };
        */
       const queryFilter = {
         queryKey: ["post-feed"],
         predicate(query) {
           return (
             query.queryKey.includes("for-you") ||
             (query.queryKey.includes("user-posts") && query.queryKey.includes(user.id))
           );
         },
       } satisfies QueryFilters;

        //first cancel and stop the running query, because if we mutate the cache and then load scroll and load next page, we might get bugs, explained in info3.txt
        await queryClient.cancelQueries(queryFilter);

        queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
          queryFilter,
          (oldData) => {
            const firstPage = oldData?.pages[0];

            //only do this if there is first page
            if (firstPage) {
              return {
                pageParams: oldData.pageParams,

                pages: [
                  {
                    nextCursor: firstPage.nextCursor,
                    posts: [newPost, ...firstPage.posts],
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            }
          },
        );


        /*
        this is for a edge case when we create a post before the data even loads, in that case the new post is not shown to us even though it is added to DB, so in this case we invalidate the query. We invalidate all the queries which have no data. MORE CLEAR explanation in info3.txt
        
        previously it was like this

        queryClient.invalidateQueries({
            queryKey: queryFilter.queryKey,
            predicate(query) {
                return !query.state.data
            },
        })
        */
       queryClient.invalidateQueries({
         queryKey: queryFilter.queryKey,
         predicate(query) {
           return queryFilter.predicate(query) && !query.state.data;
         },
       });


       //creating success toast on post creation
        toast.success("Post created Successfully");
      },

      onError(error) {
        const message = error instanceof Error ? error.message : "Failed to post, please try again.";
        toast.error(message);
      }
    });

    return mutation;
}