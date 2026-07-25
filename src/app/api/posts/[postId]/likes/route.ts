import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";


export async function GET(req: Request, 
    {params}: {params: Promise<{postId: string}>}
) {
    try {
        const {postId}= await params;
        
        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})

        const post = await prisma.post.findUnique({
            where: {id: postId},
            select:{
                likes: {
                    where:{
                        userId: loggedInUser.id
                    },
                    select:{
                        userId: true
                    }
                },
                _count:{
                    select:{
                        likes: true
                    }
                }
            }
        })

        if(!post) return Response.json({error: "Post not found"}, {status: 404})

        const data: LikeInfo = {
            likes: post._count.likes,
            isLikedByUser: !!post.likes.length
        }

        return Response.json(data);

    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}


//similarly POST AND DELETE endpoint for liking and unliking
export async function POST(req: Request, 
    {params} : {params: Promise<{postId: string}>}
) {
    try {
        const {postId}= await params;
        
        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})


        //adding later for notifications
        const post = await prisma.post.findUnique({
            where:{id: postId},
            select:{
                userId: true
            }
        })

        if(!post){
            return Response.json({error: "Post not found"}, {status: 404})
        }
        
        /*

        await prisma.like.upsert({
            where:{
                userId_postId:{
                    userId:loggedInUser.id,
                    postId
                }
            },
            create:{
                userId:loggedInUser.id,
                postId
            },
            update:{}
        })

        
        await prisma.notification.create({
            data:{
                issuerId: loggedInUser.id,
                recipientId: post.userId,
                postId,
                type: "LIKE",
            }
        })

        commenting these 2 out to wrap them in a prisma transaction for creating notifications simultaneously
        */
        await prisma.$transaction([
          prisma.like.upsert({
            where: {
              userId_postId: {
                userId: loggedInUser.id,
                postId,
              },
            },
            create: {
              userId: loggedInUser.id,
              postId,
            },
            update: {},
          }),
          ...(loggedInUser.id !== post.userId ?
             [
                prisma.notification.create({
                  data: {
                    issuerId: loggedInUser.id,
                    recipientId: post.userId,
                    postId,
                    type: "LIKE",
                  },
                }),
              ]
            : []),
        ]);


        return new Response();
    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}


export async function DELETE(req: Request, 
    {params} : {params: Promise<{postId: string}>}
) {
    try {
        const {postId}= await params;
        const {user: loggedInUser} = await validateRequest();

        if(!loggedInUser) return Response.json({error: "Unauthorized"}, {status: 401})

        //adding later for notifications
        const post = await prisma.post.findUnique({
            where:{id: postId},
            select:{
                userId: true
            }
        })

        if(!post){
            return Response.json({error: "Post not found"}, {status: 404})
        }
        
        /*
        await prisma.like.deleteMany({
            where:{
                userId:loggedInUser.id,
                postId
            }
        })
        */

        await prisma.$transaction([
          prisma.like.deleteMany({
            where: {
              userId: loggedInUser.id,
              postId,
            },
          }),
          prisma.notification.deleteMany({
            where: {
              recipientId: post.userId,
              issuerId: loggedInUser.id,
              postId,
              type: "LIKE",
            },
          }),
        ]);

        return new Response();
        
    } catch (error) {
        console.log(error);
        return Response.json({error: "Internal server error"}, {status: 500})
    }
}
