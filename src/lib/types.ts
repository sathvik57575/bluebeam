import { Prisma } from "@/generated/prisma/client";

//This is just the include object extracted into a constant so you can reuse it in multiple places instead of rewriting it everywhere
export const postDataInclude = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.PostInclude;
//similarly we have Primsa.UserInclude and so on for other models.

//similarly we hace UserGetPayload and so on for other models
//we're commenting this out and doing it below after we change somethings
/*
export type PostData = Prisma.PostGetPayload<{
  include: typeof postDataInclude;
}>;
*/

/*
satisfies keyword in Typescript is a new thing that allows you to assert that a value conforms to a certain type without changing the type of the value itself. This is useful when you want to ensure that an object matches a specific structure, but you don't want to lose the original type information.

Eg:
type Color = string | {r:number,g:number,b:number}
const blue: Color = "blue";
const red = "red" as Color
const green = "green" satisfies Color

Now when we do typeof blue or green or red, we will see Color.
When we do blue. or red. to get the string methods, we don't see them because blue is of type Color, which is string | {r:number,g:number,b:number}. So it can be anything between a string and a object 
But when we do green. we see the string methods because green is of type Color, but it also satisfies Color, so it has the string methods available. So it doesn't change the type of green, it just asserts that it satisfies the Color type, so we can use the string methods on it.
**ACTUALLY WE WERE SLIGHTLY WRONG, EVEN IN CASE OF blue. string methods appear, only for red they don't.
Another clear difference is when we hover blue, red, green variables we can see their types, blue and red show Color, while green just shows string literal "green" so this means it's type hasn't changed**

Next is Prisma.PostInclude. This is so complicated what the fuck.
Prisma.PostInclude is a TypeScript type that describes what DB relations to other tables you are allowed to include when querying Post.
It is generated When you run "npx prisma generate"
Prisma generates types based on your schema.
One of those is Prisma.PostInclude

But what does it contain? I explained this in the info2.txt file. Go check there, we're moving on.

export type PostData = Prisma.PostGetPayload<{
  include: typeof postDataInclude;
}>;
PostGetPayload is a Prisma utility type that says:
"Give me the TypeScript type of a Post, but with these relations included"

So PostData ends up being:
{
  id: string
  content: string
  userId: string
  createdAt: Date
  user: {           // ← included because of postDataInclude
    username: string
    displayName: string
    avatarUrl: string | null
  }
}
We will use the type PostData instead of the default Post type from Prisma because the default Post type doesn't include user data. 
Without this, if you typed post as just Post from Prisma:
post.user.username  //TypeScript error: user doesn't exist on Post type
With PostData:
post.user.username  //TypeScript knows user is included

typeof postDataInclude
Prisma.PostGetPayload<{
  include: typeof postDataInclude;  // ← typeof
}>
typeof gets the TypeScript type of the postDataInclude variable. This connects the constant to the type if you change postDataInclude, PostData automatically updates to match.
*/


/*creating a user select to use in multiple places, we can use this in the postDataInclude like this
export const postDataInclude = {
  user: {
    select: userDataSelect
  },
} satisfies Prisma.PostInclude;

But for now we're keeping it like that to avoid confusion and mess up my explanation of the postDataInclude and Prisma.PostGetPayload types
*/
export const userDataSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;


export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null
}


export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}


export function getUserDataSelect(loggedInUserId: string){
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true, //added later
    createdAt: true, //added later
    followers: {
      where: {
        followerId: loggedInUserId
      },
      select:{
        followerId: true
      }
    },
    _count: {
      select: {
        followers: true,
        posts: true //added later
      }
    }
  } satisfies Prisma.UserSelect;
} 
//added later 
export type userData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>
}>

export function getPostDataInclude(loggedInUserId: string){
  return {
    user: {
      select: getUserDataSelect(loggedInUserId)
    },
    
    attachments: true,

    //adding for likes
    likes: {
        where:{
            userId: loggedInUserId
        },
        select:{
            userId: true
        }
    },

    //added for bookmarks feature
    bookmarks: {
      where:{
        userId: loggedInUserId
      },
      select:{
        userId: true
      }
    },

    _count:{
        select:{
            likes: true,
            comments: true //added later
        }
    }
  } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>


export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}


export interface BookmarkInfo {
  isBookmarkedByUser: boolean
}


export function getCommentDataInclude(loggedInUserId: string){
  return {
    user: {
      select: getUserDataSelect(loggedInUserId)
    }
  } satisfies Prisma.CommentInclude
} 

export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataInclude>
}>

export interface CommentsPage {
  comments: CommentData[],
  previousCursor: string | null
}

//no need to make this a function because this is not dependent on the loggedInUserId, don't overthink
export const NotificationDataIncude = {
  issuer:{
    select:{
      username: true,
      displayName: true,
      avatarUrl: true
    }
  },

  post:{
    select:{
      content: true
    }
  }
} satisfies Prisma.NotificationInclude

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof NotificationDataIncude
}>

export interface NotificationsPage {
  notifications: NotificationData[],
  nextCursor: string | null
}

export interface NotificationCountInfo {
  unreadCount: number
}

export interface MessagesCountInfo {
  unreadCount: number
}