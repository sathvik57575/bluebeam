import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Channel, ChannelHeader, ChannelHeaderProps, MessageInput, MessageList, Window } from "stream-chat-react";


//creating later to make the Chat component responsive
interface ChatChannelProps {
    open: boolean,
    openSidebar: ()=>void
    //we will pass this openSidebar to the parent(Chat), and it can hide the show the sidebar and hide this channel
}


export default function ChatChannel({open, openSidebar}: ChatChannelProps){
    
    
    return (
        <div className={cn("w-full md:block", !open && "hidden")}>
            <Channel>
                <Window>
                    {/* <ChannelHeader/> commenting out since we're creating our own ChannelHeader component using this default imported ChannelHeader */}
                    <CustomChannelHeader openSidebar={openSidebar}/>
                    <MessageList/>
                    <MessageInput focus/>
                </Window>
            </Channel>
        </div>
    )
}


interface CustomChannelHeaderProps extends ChannelHeaderProps {
    openSidebar: ()=>void
}

function CustomChannelHeader ({openSidebar, ...props}:CustomChannelHeaderProps){

    return (
        <div className="flex items-center gap-3">
            <div className="h-full p-2 md:hidden">
                <Button size="icon" variant="ghost" onClick={openSidebar}>
                    <Menu className="size-5"/>
                </Button>
            </div>
            <ChannelHeader {...props}/>
        </div>
    )
}