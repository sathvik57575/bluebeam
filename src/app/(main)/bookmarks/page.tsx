import { Metadata } from "next";
import Bookmarks from "./BookMarks";
import TrendsSidebar from "@/components/TrendsSidebar";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

//not using generateMetadata() function, this is just static metadata setter, since we only have one bookmarks page, unlike the individual post details page, or individual user profile page, where each one's metadata(title) is different
export const metadata: Metadata= {
    title: "Bookmarks"
}

export default async function Page(){

    const {user} = await validateRequest();

    //getting the number of bookmarks of this user 
    const bookmarkcount = await prisma.user.findUnique({
        where:{id: user?.id},
        select:{
            _count:{
                select:{
                    bookmarks:true
                }
            }
        }
    })

    return (
        <main className="flex w-full min-w-0 gap-5">
            <div className="w-full min-w-0 space-y-5">
                <div className="rounded-2xl bg-card p-5 shadow-sm">
                    <h1 className="text-center text-2xl font-bold">Bookmarks({bookmarkcount?._count.bookmarks})</h1>
                </div>
                <Bookmarks />
            </div>
            <TrendsSidebar/>
        </main>
    )
}