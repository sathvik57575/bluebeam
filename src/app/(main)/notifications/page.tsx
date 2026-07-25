import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import prisma from "@/lib/prisma";
import { Metadata } from "next";
import Notifications from "./Notifications";

export const metadata: Metadata= {
    title: "Notifications"
}

export default async function Page(){

    //all this not needed since 

    const {user} = await validateRequest();
    if(!user) return;

    const notificationCount = await prisma.user.findUnique({
        where:{
            id: user.id,
        },
        select:{
            _count:{
                select:{
                    receivedNotifications:{
                        where:{
                            read: false
                        }
                    }
                }
            }
        }
    })

    //we can also fetch the notification object for this user where the read is false lol. 


    return (
        <main className="flex w-full min-w-0 gap-5">
            <div className="w-full min-w-0 space-y-5">
                <div className="rounded-2xl bg-card p-5 shadow-sm">
                    <h1 className="text-center text-2xl font-bold">Notifications({notificationCount?._count.receivedNotifications})</h1>
                </div>
                <Notifications />
            </div>
            <TrendsSidebar/>
        </main>
    )
}