import { kyInstance } from "@/lib/ky";
import { LikeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: string;
  initialState: LikeInfo;
}

export default function LikeButton({ initialState, postId }: LikeButtonProps) {
  const { data } = useQuery({
    queryKey: ["like-info", postId],
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/likes`).json<LikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["like-info", postId];

  const {mutate} = useMutation({
    mutationFn: () => {
      return data.isLikedByUser
        ? kyInstance.delete(`/api/posts/${postId}/likes`)
        : kyInstance.post(`/api/posts/${postId}/likes`);
    },

    onMutate: async ()=>{
        await queryClient.cancelQueries({queryKey});

        const previousState = queryClient.getQueryData<LikeInfo>(queryKey);

        queryClient.setQueryData<LikeInfo>(queryKey, ()=>{
            return {
                likes: (previousState?.likes || 0) + (previousState?.isLikedByUser? -1: 1),
                isLikedByUser: !previousState?.isLikedByUser
            }
        })

        return {previousState}
    },

    onError(error, variables, context) {
        queryClient.setQueryData(queryKey, context?.previousState)
        console.log(error);
        toast.error("Something went wrong. Please try again.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-feed", "recommended"] });
    },
  });

  return (
    <button className="flex items-center gap-2" onClick={()=>mutate()}>
        <Heart className={cn("size-5 cursor-pointer", data.isLikedByUser && "fill-red-500 text-red-500")}/>
        <span className="font-medium text-sm tabular-nums">{data.likes} <span className="hidden sm:inline">likes</span>
        </span>
        {/* tabular-nums makes sure that every number has same width, or when we switch from 1 like to 2 likes, the heart icon might move aronud a bit, since every number has a different width by default */}
    </button>
  )
}
