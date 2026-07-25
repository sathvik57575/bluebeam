import { useUploadThing } from "@/lib/uploadthing";
import { UpdateUserProfileValues } from "@/lib/validation";
import { InfiniteData, QueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";
import { PostsPage } from "@/lib/types";
import { toast } from "sonner";


export function useUpdateProfileMutation(){

    const router = useRouter();

    const queryClient = useQueryClient();

    const {startUpload: startAvatarUpload} = useUploadThing("avatar")

    const mutation = useMutation({
        mutationFn: async ({values, avatar}: {values: UpdateUserProfileValues, avatar?: File})=> {

            console.log('Avatar',avatar);

            return Promise.all([
                updateUserProfile(values),
                avatar && startAvatarUpload([avatar])
            ])
        },

        onSuccess: async ([updatedUser, uploadResult])=>{
             const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl;

             const queryFilter: QueryFilters = {
                queryKey:["post-feed"]
                //we don't have to be more specific because if there is no post from us in there, it will be ignored, logic below
             }

              await queryClient.cancelQueries(queryFilter);

              queryClient.setQueriesData<InfiniteData<PostsPage, string|null>>(
                queryFilter,

                (oldData)=>{

                    if(!oldData) return;

                    return {
                        pageParams: oldData.pageParams,

                        pages: oldData.pages.map(page => ({
                            nextCursor: page.nextCursor,

                            posts: page.posts.map(post => {
                                if(post.user.id === updatedUser.id){
                                    return {
                                        ...post,
                                        user:{
                                            ...updatedUser,
                                            avatarUrl: newAvatarUrl || post.user.avatarUrl
                                        }
                                    }
                                }

                                return post;
                            })
                        }))
                    }
                }
              )

            //re-fetches server side data. Like in our user profile, the top section above the infinite loading posts is a server component. We are refreshing/re-fetching it to update with new bio, displayname and avatar picture. Since the above setQueries data only updates info for the client side components like infinite loading posts, we have to refresh the server components if we want to see new data. This is ok since it is just one small component unlike client component like infinite loading posts in for-you, user profile pages.
            router.refresh();

            toast.success("Profile successfully updated")
        },

        onError(error){
            console.log(error);
            toast.error("Failed to update profile, Please try again")
        }
    })

    return mutation;
}