"use client"; ////make sure to add this since this is a client component being called in a server component(MenuBar.tsx)

import { Button } from "@/components/ui/button";
import { kyInstance } from "@/lib/ky";
import { MessagesCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import Link from "next/link";

interface MessageButtonProps {
  initialState: MessagesCountInfo;
}

export default function MessageButton({
  initialState,
}: MessageButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: ()=>kyInstance.get("/api/messages/unread-count").json<MessagesCountInfo>(),
    initialData: initialState,
    refetchInterval: 60 * 1000, //refetch every 1 minute
  });

  return (
    <Button
      variant="ghost"
      className="flex items-center gap-3 justify-start"
      title="Messages"
      asChild
    >
      <Link href={"/messages"} className="relative">

          <Mail className="size-5" />

          {!!data.unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}

        <span className="hidden lg:inline">Messages</span>
      </Link>
    </Button>
  );
}
