import PostEditor from "@/components/posts/editor/PostEditor";
import Post from "@/components/posts/Post";
import TrendsSidebar from "@/components/TrendsSidebar";
import prisma from "@/lib/prisma";
import { postDataInclude } from "@/lib/types";
import ForYouFeed from "./ForYouFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";

export default function Home() {

  /*
  const posts = await prisma.post.findMany({
      orderBy:{
        createdAt:"desc"
      },

      //this is same as doing .populate() in mongoose, this is how we get the user data for each post, so that we can display the username and avatar of the user who created the post. We use select to only get the fields we need, which are username, displayName and avatarUrl.
       
      include:{
        user:{
          select:{
            username:true,
            displayName:true,
            avatarUrl:true
          }
        }
      }
      //replacing it with postDataInclude.
     include: postDataInclude
  })
  */

  return (
    <main className="w-full flex min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor/>

        {/* 
        {posts.map((post)=>(
          <Post key={post.id} post={post}/>
        ))} 
         */}

         {/* <ForYouFeed/> */}
         {/* we are commenting this out since we will use Tabs to show both for-you and following feeds */}
         <Tabs defaultValue="for-you">
            <TabsList>
                <TabsTrigger value="for-you">For you</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>

            <TabsContent value="for-you">
                <ForYouFeed/>
            </TabsContent>
            <TabsContent value="following">
                <FollowingFeed/>
            </TabsContent>
         </Tabs>
      </div>

      <TrendsSidebar/>
    </main>
  );
}
