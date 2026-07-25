"use client";

import { Loader2 } from "lucide-react";
import useInitializeChatClient from "./useInitializeChatClient";
import {Chat as Stream_Chat} from "stream-chat-react"
import ChatSidebar from "./ChatSidebar";
import ChatChannel from "./ChatChannel";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function Chat(){

    //adding later to make this component responsive 
    //managing the state of sidebar
    const [sidebarOpen, setSidebarOpen] = useState(true); //I first set the initial state to false, so on small screens ChatChannel shows first. But later changed it to true so sidebar shows first


    //getting the current theme, this will be stored in resolvedTheme, normal theme variable is for the theme set, so if we selected system in the site, theme will be system, but resolvedTheme will be either dark/white depending on what system is. That's the only difference between resolvedTheme and theme.
    const {resolvedTheme, theme} = useTheme();


    const chatClient = useInitializeChatClient();
    //we can initialize this chat client in the root layout of this project so it starts as soon as we open any page on the website, but it's better if we do it in here on the chat page, in this way we don't create unnecessary connections. We don't need a connection to stream when we're using the app without chat page 

    //if the chat client is null before the client is loaded, we'll just show a loader
    if (!chatClient) {
        return <Loader2 className="mx-auto my-3 animate-spin" />;
    }



    return (
        <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="absolute bottom-0 top-0 flex w-full">

                {/* same as linguaflow, we use the Chat component(renamed to Stream_Chat since this component is also called Chat) from stream */}
                <Stream_Chat 
                    client={chatClient}
                    theme={
                        resolvedTheme=="dark" ?
                        "str-chat__theme-dark"
                        : "str-chat__theme-light"
                    }
                >
                    <ChatSidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>

                    <ChatChannel open={!sidebarOpen} openSidebar={()=>setSidebarOpen(true)}/>

                </Stream_Chat>
            </div>
        </main>
    )
}
