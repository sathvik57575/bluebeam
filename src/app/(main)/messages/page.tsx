import { Metadata } from "next";
import Chat from "./Chat";

export const metadata: Metadata = {
    title: "Messages"
}

export default function Page(){
    return <Chat/>
}

//I am creating the Chat in a different component because Chat has to be a client component(calling hooks etc), and to set metadata we need a server component, so we need 2 separate files, so we're calling Chat in this component
//also the chat page will not have a sidebar because there is not enough room bruh. It will still contain the Menubar since that is in the layout of (main). So page.tsx renders Chat.tsx inside it.
