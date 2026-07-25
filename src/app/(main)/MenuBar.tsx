import { Button } from "@/components/ui/button";
import { Bell, Bookmark, Home, Mail, Menu } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import MessageButton from "./MessagesButton";
import streamServerClient from "@/lib/stream";

interface MenuBarProps {
  className?: string;
}

export async function MenuBar({ className }: MenuBarProps) {

  const {user} = await validateRequest();
  if(!user) return null;


  // const unreadNotificationCount = await prisma.notification.count({
  //   where: {
  //     recipientId: user.id,
  //     read: false
  //   }
  // })

  // const {total_unread_count} = await streamServerClient.getUnreadCount(user.id);


  //we can wrap above 2 in a promise.all
  const [unreadNotificationCount, {total_unread_count}] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false
      }
    }),

    streamServerClient.getUnreadCount(user.id)
  ])

  /*
    or we can await the value
    const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
      prisma.notification.count({
        where: {
          recipientId: user.id,
          read: false,
        },
      }),
      (await streamServerClient.getUnreadCount(user.id)).total_unread_count,
    ]);
  */

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start"
        title="Home"
        asChild
      >
        <Link href={"/"}>
          <Home className="size-5"/>
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      {/* <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start"
        title="Notifictions"
        asChild
      >
        <Link href={"/notifications"}>
          <Bell className="size-5"/>
          <span className="hidden lg:inline">Notifications</span>
        </Link>
      </Button> */}

      <NotificationsButton initialState={{unreadCount:unreadNotificationCount}}/>

      {/* <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start"
        title="Messages"
        asChild
      >
        <Link href={"/messages"}>
          <Mail className="size-5"/>
          <span className="hidden lg:inline">Messages</span>
        </Link>
      </Button> */}
      <MessageButton initialState={{unreadCount: total_unread_count}}/>

      <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start"
        title="Bookmarks"
        asChild
      >
        <Link href={"/bookmarks"}>
          <Bookmark className="size-5"/>
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>


      {/* added later */}
      <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start md:hidden"
        title="Trending&Following"
        asChild
      >
        <Link href={"/Trending&Following"}>
          <Menu className="size-5"/>
          <span className="hidden lg:inline">Trending&Following</span>
        </Link>
      </Button>
    </div>
  );
}
