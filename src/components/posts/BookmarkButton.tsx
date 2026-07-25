import { kyInstance } from "@/lib/ky";
import { BookmarkInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

interface BookmarkButtonProps {
  postId: string;
  initialState: BookmarkInfo;
}

export default function BookmarkButton({ initialState, postId }: BookmarkButtonProps) {
  const { data } = useQuery({
    queryKey: ["bookmark-info", postId],
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/bookmark`).json<BookmarkInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["bookmark-info", postId];

  const {mutate} = useMutation({
    mutationFn: () => {
      return data.isBookmarkedByUser
        ? kyInstance.delete(`/api/posts/${postId}/bookmark`)
        : kyInstance.post(`/api/posts/${postId}/bookmark`);
    },

    onMutate: async ()=>{

        toast.success(`${data.isBookmarkedByUser? "Post unBookmarked": "Post BookMarked"}`)

        await queryClient.cancelQueries({queryKey});

        const previousState = queryClient.getQueryData<BookmarkInfo>(queryKey);

        queryClient.setQueryData<BookmarkInfo>(queryKey, ()=>{
            return {
                isBookmarkedByUser: !previousState?.isBookmarkedByUser
            }
        })

        return {previousState}
    },

    onError(error, variables, context) {
        queryClient.setQueryData(queryKey, context?.previousState)
        console.log(error);
        toast.error("Something went wrong. Please try again.");
    },
  });

  return (
    <button className="flex items-center gap-2" onClick={()=>mutate()}>
        <Bookmark className={cn("size-5 cursor-pointer", data.isBookmarkedByUser && "fill-primary text-primary")}/>
    </button>
  )
}
