"use client";

import { FollowerInfo } from "@/lib/types";
import { Button } from "./ui/button";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { kyInstance } from "@/lib/ky";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowButton({
  userId,
  initialState,
}: FollowButtonProps) {
  const { data } = useFollowerInfo(userId, initialState);

  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["follower-info", userId]

  const { mutate } = useMutation({
    mutationFn: () => {
      return (data.isFollowedByUser
        ? kyInstance.delete(`/api/users/${userId}/followers`)
        : kyInstance.post(`/api/users/${userId}/followers`)
      );
    },

    onMutate: async () => {
        await queryClient.cancelQueries({queryKey});

        const previousState = queryClient.getQueryData<FollowerInfo>(queryKey);

        queryClient.setQueryData<FollowerInfo>(queryKey, ()=>{
            return {
                followers: (previousState?.followers || 0) + (previousState?.isFollowedByUser ? -1: 1),
                isFollowedByUser: !previousState?.isFollowedByUser
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
    <Button
      variant={data.isFollowedByUser ? "secondary" : "default"}
      onClick={() => mutate()}
      className="cursor-pointer dark:text-white"
    >
      {data.isFollowedByUser ? "Unfollow" : "Follow"}
    </Button>
  );
}
