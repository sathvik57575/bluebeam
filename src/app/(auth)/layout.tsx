import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";


export default async function layout({children}: {children: React.ReactNode}){

    const {user} = await validateRequest();
    if(user) redirect('/'); //can even write return redirect('/'),but even not writing "return" is ok as redirect() returns never, and it will not execute below code

    return <>{children}</>
}