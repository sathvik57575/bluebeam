"use client"; //no need to write this as we are rendering this component inside ForYouFeed.tsx which is also a client component, just doing it for understanding

// import { Post as PostData } from "@/generated/prisma/client"; //import the Post type from prisma client, hover over it to see. Commenting this out later since we will create a custom type that includes the user data for each post, so that we can display the username and avatar of the user who created the post. We will create this type in src/lib/types.ts and import it here.
import Link from "next/link";
import { UserAvatar } from "../UserAvatar";
import { cn, formatRelativeDate } from "@/lib/utils";
import { PostData } from "@/lib/types";
import { useSession } from "@/app/(main)/SessionProvider";
import PostMoreButton from "./PostMoreButton";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";
import { Media } from "@/generated/prisma/client";
import Image from "next/image";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import Comments from "../comments/Comments";

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {


  const {user} = useSession();

  //added later
  const [showComments, setShowComments] = useState(false)

  return (
    <article className="group/post space-y-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <UserTooltip user={post.user}>
            <Link href={`/users/${post.user.username}`}>
              <UserAvatar avatarUrl={post.user.avatarUrl} />
            </Link>
          </UserTooltip>

          <div>
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-medium hover:underline"
              >
                {post.user.displayName}
              </Link>
            </UserTooltip>

            <Link
              href={`/posts/${post.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(post.createdAt)}
              {/* we can just write {formatRelativeDate(new Date(post.createdAt))} instead of using ky on the frontend to convert strings to Date object */}
            </Link>
          </div>
        </div>

        {user.id === post.user.id && (
          <PostMoreButton
            post={post}
            className="opacity-0 transition-opacity group-hover/post:opacity-100 cursor-pointer"
          />
        )}
      </div>
      
      <Linkify> {/* added later */}
        <div className="whitespace-pre-line wrap-break-word">
          {post.content}
        </div>
      </Linkify>

      {/* adding later for displaying attachments */}
      {!!post.attachments.length && (
        <MediaPreviews attachments={post.attachments}/>
      )}

      <hr className="text-muted-foreground"/>
      <div className="flex justify-between gap-5">
        <div className="flex items-center gap-5">
          <LikeButton postId={post.id} initialState={{
            likes: post._count.likes,
            isLikedByUser: post.likes.some(like => like.userId==user.id)
          }}/>

          <CommentButton onClick={()=>setShowComments(!showComments)} post={post} />
        </div>

          <BookmarkButton postId={post.id} initialState={{
            isBookmarkedByUser: post.bookmarks.some(b=>b.userId==user.id)
          }}/>
      </div>

      {showComments && (<Comments post={post} />)}
      
    </article>
  );
}


//creating components for media preview
interface MediaPreviewsProps {
  attachments: Media[]
  //using Media[], here instead of Attachment[], since we don't need it. post.attachments is of type Media[] since the two tables are linked. If we use Attachment[] here it will give error as post.attachments is a DB object contaning {id, postId, url, type, createdAt}, and not {file, mediaId, isUploading}
  //In the PostEditor, we use Attachment[] since we are uploading files from our device and storing it's details like Attachment<{file, mediaId, isUploading}> etc. But since post.attachments comes from DB, it doesn't have any type/interface called Attachment 
}

function MediaPreviews({attachments}:MediaPreviewsProps){
  return (
    <div className={cn("flex flex-col gap-3", attachments.length>1 && "sm:grid sm:grid-cols-2")}>
      {attachments.map((attachment)=>(
        <MediaPreview key={attachment.id} attachment={attachment}/>
      ))}
    </div>
  )
}


interface MediaPreviewProps{
  attachment: Media
}

function MediaPreview({attachment}: MediaPreviewProps){
  if(attachment.type === "IMAGE"){
    return (
      <Image
        src={attachment.url}
        alt="Media image attachment"
        width={500}
        height={500}
        className="mx-auto size-fit rounded-2xl max-h-120"
      />
    );
  }

  if(attachment.type === "VIDEO"){
    return (
      // wrapping this <video> in a div is better because sometimes an browser extention like videospeed controller might get it's own column
      <div> 
        <video
          src={attachment.url}
          controls
          className="mx-auto size-fit max-h-120 rounded-2xl"
        />
      </div>
    );
  }

  return <p className="text-destructive"> UNsupported Media type</p>
}



interface CommentButtonProps {
  onClick: ()=>void
  post: PostData
}

function CommentButton({onClick, post}: CommentButtonProps){
  return (
    <button className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
      <MessageSquare className="size-5"/>
      <span className="text-sm tabular-nums font-medium">
        {post._count.comments}{" "}
        <span className="hidden sm:inline">comments</span>
      </span>
    </button>
  )
}