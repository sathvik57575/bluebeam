import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";
import { toast } from "sonner";
import { PostsPage } from "@/lib/types";

export function useDeletePostMutation(){

    const queryClient = useQueryClient();
    
    const router = useRouter();
    const pathName = usePathname();

    const mutation = useMutation({
        mutationFn: deletePost,

        onSuccess: async (deletedPost)=>{
            const queryFilter: QueryFilters = {
                queryKey:["post-feed"]
            }

            await queryClient.cancelQueries(queryFilter);


            queryClient.setQueriesData<InfiniteData<PostsPage , string|null>>(
                queryFilter,

                (oldData) =>{
                    if(!oldData) return;

                    return {
                        pageParams: oldData.pageParams,

                        pages: oldData.pages.map(page=>({
                            nextCursor: page.nextCursor,
                            posts: page.posts.filter(post=>post.id!==deletedPost.id)
                        }))
                    }
                }
            )

            //we don't to invalidate queries here again, since if the pages are empty we can't see the posts or their delete buttons in the first place lol.

            toast.success("Post deleted successfully");

            //next we redirect of we are on the indiidual posts details page
            if(pathName == `/posts/${deletedPost.id}`){
                router.push(`/users/${deletedPost.user.username}`)
            }
        },

        onError(error){
            console.log(error);
            toast.error("Falied to delete this post, Please try again")
        }
    })


    return mutation;
}