"use client"; ////make sure to add this since this is a client component being called in a server component(MenuBar.tsx)

import { Button } from "@/components/ui/button";
import { kyInstance } from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationsButtonProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButton({
  initialState,
}: NotificationsButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: ()=>kyInstance.get("/api/notifications/unread-count").json<NotificationCountInfo>(),
    initialData: initialState,
    refetchInterval: 60 * 1000, //refetch every 1 minute
  });

  /*
    NOTE:  I found out something, 
    queryFn: ()=>kyInstance.get("/api/notifications/unread-count").json<NotificationCountInfo>(),
    this is working
    and this is working too
    queryFn: kyInstance.get("/api/notifications/unread-count").json<NotificationCountInfo>

    But these 2 won't work
    queryFn: ()=>kyInstance.get("/api/notifications/unread-count").json<NotificationCountInfo>
    or 
    queryFn: kyInstance.get("/api/notifications/unread-count").json<NotificationCountInfo>()

    here
    queryFn: () => kyInstance.get(...).json<NotificationCountInfo>()
    Arrow function that calls .json() which returns a Promise. TanStack calls the arrow function and arrow function calls .json() so Promise resolves successfully. 

    this also works
    queryFn: kyInstance.get(...).json<NotificationCountInfo>
    Passing .json as a function reference directly (no ()). TanStack calls it so Promise resolves.
    
    but this doesn't work
    queryFn: () => kyInstance.get(...).json<NotificationCountInfo>
    Arrow function that returns the .json function itself instead of calling it. TanStack calls the arrow function and it gets back a function, not a Promise so nothing resolves. The inner api function(with .json) is never called

    queryFn: kyInstance.get(...).json<NotificationCountInfo>()
    This Calls .json() immediately at component render time, not when TanStack wants to fetch. queryFn receives the resolved value (or a pending Promise that already started), not a function to call later. This means it fetches once on render and never refetches. 

    So the pattern is
    queryFn must be a function that TanStack can call whenever it wants to fetch. So either:
    Give it a function reference it can call: fn or () => fn()
    Don't give it an already-called result: fn() 
    Don't give it a function that returns a function: () => fn 

    Same principle I learned earlier with onSuccess: onOpenChange(false) vs onSuccess: () => onOpenChange(false).
   */

  return (
    <Button
      variant="ghost"
      className="flex items-center gap-3 justify-start"
      title="Notifictions"
      asChild
    >
      <Link href={"/notifications"} className="relative">

        {/* <div className="relative"> adding a div here to wrap, removing it later as it is messing up my styling */}

          <Bell className="size-5" />

          {/* adding the code for to display the unread notifications number here */}
          {!!data.unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        {/* </div> */}

        <span className="hidden lg:inline">Notifications</span>
      </Link>
    </Button>
  );
}
