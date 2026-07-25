"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface FollowerCountProps{
    userId: string,
    initialState: FollowerInfo
}

export default function FollowerCount({userId, initialState}:FollowerCountProps){
    const {data} = useFollowerInfo(userId, initialState);
    //we can only call this in a client component because it uses a hook, and hooks can only be used in client components. If we tried to use this in a server component, we would get an error saying "Hooks can only be called inside of the body of a function component."

    return (
        <span>
            Followers: {" "}
            <span className="font-semibold">
                {formatNumber(data.followers)}
            </span>
        </span>
    )
}