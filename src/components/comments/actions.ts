"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content: contentValidated } = createCommentSchema.parse({ content });

    /*
      const newComment = await prisma.comment.create({
        data: {
          content: contentValidated,
          userId: user.id,
          postId: post.id,
        },
        include: getCommentDataInclude(user.id),
      });
    */
    //commenting this out to create a transaction for creating a notification simultaneously

    const [newComment]= await prisma.$transaction([
       prisma.comment.create({
        data: {
          content: contentValidated,
          userId: user.id,
          postId: post.id,
        },
        include: getCommentDataInclude(user.id),
      }),
      
      ...(user.id!==post.userId ? 
        [
          prisma.notification.create({
            data:{
              issuerId: user.id,
              recipientId: post.userId,
              postId: post.id,
              type: "COMMENT",
            }
          })
        ]:[])
    ])
    //Also since we need to return newComment, we can return values from prisma transactions by destructuting it as an array. The first value destructured is the value of the first operation and the 2nd value is the value of the 2nd operation. We only care about first one here

  return newComment;
}

//ALSO WE ARE not deleting the notifications when we are deleting comments, since we don't have a way of distinguing multiple comments, a user can leave multiple comments lol. How are we going to delete that specific comment notification? 
// We can solve this by adding an optional commentId in the Notification prisma model, but for now I am not doing it.

export async function deleteComment(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) throw new Error("Comment not found");

  if (comment.userId !== user.id) throw new Error("Unauthorized");

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });

  return deletedComment;
}
