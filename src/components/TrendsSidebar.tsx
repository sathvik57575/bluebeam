import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, userDataSelect } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import { cn, formatNumber } from "@/lib/utils";
import FollowButton from "./FollowButton";
import UserTooltip from "./UserTooltip";

interface TrendsSidebarProps {
  className?:string;
}

export default function TrendsSidebar({ className }: TrendsSidebarProps) {
  return (
    <div className={cn("sticky top-21 hidden md:block lg:w-80 w-72 h-fit flex-none space-y-5", className)}>
      <Suspense fallback={<Loader2 className="animate-spin mx-auto" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  // await new Promise((resolve) => setTimeout(resolve, 10000)); //simulate loading time

  const { user: loggedInUser } = await validateRequest();
  if (!loggedInUser) return null;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: loggedInUser.id,
      },
      //also we only wanna show user we are not already following, we will implement this later when we have follow feature
      followers:{
        none:{
          followerId: loggedInUser.id
        }
      }
    },

    // select: userDataSelect, //commenting this out
    select: getUserDataSelect(loggedInUser.id),
    take: 5,

    //we can even show top 5 user with highest following
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>

      {usersToFollow.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3">

          <UserTooltip user={user}>
            <Link
              href={`/users/${user.username}`}
              className="flex items-center gap-3"
            >
              <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />

              <div>
                <p className="line-clamp-1 break-all font-semibold hover:underline ">
                  {user.displayName}
                </p>
                <p className=" line-clamp-1 break-all text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </Link>
          </UserTooltip>


          {/* <Button className="cursor-pointer">Follow</Button> */}

          <FollowButton 
            userId={user.id} 
            initialState={    
              {
                followers: user._count.followers,
                // isFollowedByUser: !!user.followers.length, //we can also do this but tutor did this in case we fetch multiple users 
                isFollowedByUser: user.followers.some(
                  ({followerId})=> followerId === loggedInUser.id
                ) 
                //checking if this array contains the id of the currently logged in user, arr.some() returns true/false
              }
            }
          />

        </div>
      ))}
    </div>
  );
}

//this will only work in production, in devolopment, every time we load the page, the cache will be cleared so it will always fetch the trending topics from the database, but in production, it will cache the result for 3 hours, so it will only fetch the trending topics from the database once every 3 hours, and in between, it will serve the cached result, which is good for performance, since calculating trending topics is expensive. We can also add a revalidate button for admin to manually revalidate the cache when needed. But not doing this right now.
const getTrendingTopics = unstable_cache(
  async () => {
            const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
              SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
              FROM posts
              GROUP BY (hashtag)
              ORDER BY count DESC, hashtag ASC
              LIMIT 5
              `;

              /*
              This is raw SQL used when Prisma's query builder can't express what you need. The trending topics query is too complex for Prisma's API so raw SQL is used.

              regexp_matches(content, '#[[:alnum:]_]+', 'g') - finds all hashtags in post content
              unnest() - converts array of matches into individual rows
              LOWER() - makes hashtags case insensitive (#Hello = #hello)
              COUNT(*) - counts how many posts use each hashtag
              GROUP BY hashtag - groups by unique hashtag
              ORDER BY count DESC - most used first
              LIMIT 5 - only top 5
              The <{ hashtag: string; count: bigint }[]> is a TypeScript generic telling Prisma what shape the result rows will be.
              */

        return result.map(row=>({
          hashtag: row.hashtag,
          count: Number(row.count)
        }))
},

["trending_topics"],

{
  revalidate: 3*60*60
});

async function TrendingTopics() {

  const trendingTopics = await getTrendingTopics();

  return <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
    <div className="text-xl font-bold">Trending topics</div>

    {trendingTopics.map(({hashtag, count})=>{
      const title = hashtag.split("#")[1];

      return (
        <Link key={title} href={`/hashtag/${title}`} className="block">
          <p className="line-clamp-1 break-all font-semibold hover:underline" title={hashtag}>{hashtag}
          </p>

          <p className="text-sm text-muted-foreground">
            {formatNumber(count)} {count ==1 ?"post":"posts"}
          </p>
        </Link>
      )
    })}
    </div>
}
