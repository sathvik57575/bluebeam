"use client";

import React, { useState } from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export default function ReactQueryprovider({children}:{children:React.ReactNode}){

    const [client] = useState(new QueryClient());
    /*
    in docs they did 
    // docs way - lazy initialization
    const [client] = useState(() => new QueryClient())

    Both work fine in practice. The difference is
    useState(new QueryClient())  creates a QueryClient instance every render, but only uses the first one
    useState(() => new QueryClient())  only creates the instance once, on first render

    The arrow function version from docs is technically more correct and efficient, but in this case since ReactQueryProvider only renders once at the root level, it doesn't matter.
    */

    return (
        <QueryClientProvider client={client}>
            {children}
            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    )
}