import { ChannelList, ChannelPreviewMessenger, ChannelPreviewUIComponentProps, useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider"
import { Button } from "@/components/ui/button";
import { MailPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import NewChatDialog from "./NewChatDialog";
import { useQueryClient } from "@tanstack/react-query";


//creating later to make Chat component responsive
interface ChatSidebarProps {
    open:boolean
    onClose: ()=>void
}


export default function ChatSidebar({onClose, open}:ChatSidebarProps){

    const {user} = useSession();

    
    //adding latest for invalidating/updating unread message count
    const queryclient = useQueryClient();
    const {channel} = useChatContext();
    useEffect(()=>{
        if(channel?.id){
            queryclient.invalidateQueries({queryKey: ["unread-messages-count"]})
        }
    },[channel?.id, queryclient])


    //adding later
    const ChannelPreviewCustom = useCallback((props: ChannelPreviewUIComponentProps)=>{
        return (
            <ChannelPreviewMessenger {...props} 
                onSelect={()=>{
                    props.setActiveChannel?.(props.channel, props.watchers);
                    onClose();
                }}
            />
        )
    }, [onClose])


    return (
        <div className={cn("size-full md:flex flex-col border-e md:w-72", open ?"flex": "hidden")}>

            <MenuHeader onClose={onClose}/>

            <ChannelList
                filters={{
                    type: "messaging",
                    members: {$in: [user.id]}
                }}

                showChannelSearch

                options={{state: true, presence: true, limit: 10}}

                sort={{last_message_at: -1}}

                additionalChannelSearchProps={{
                    searchForChannels: true,
                    searchQueryParams: {
                        channelFilters: {
                            filters: {members: {$in: [user.id]}}
                        }
                    },
                    // searchForUsers: false
                }}


                //adding later for custom preview because we want to close chatsidebar and open chatchannel once we select a channel
                Preview={ChannelPreviewCustom}
            />
        </div>
    )
}


interface MenuHeaderProps {
    onClose: ()=>void
}

function MenuHeader ({onClose}:MenuHeaderProps){

    //adding later
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);

    return (
        <>
            <div className="flex items-center gap-3 p-2">
                <div className="h-full md:hidden">
                    <Button size="icon" variant="ghost" onClick={onClose}>
                        <X className="size-5"/>
                    </Button>
                </div>

                {/* adding later */}
                <h1 className="me-auto text-xl font-bold ms-2">Messages</h1>

                <Button
                    size="icon"
                    variant="ghost"
                    title="Start new chat"
                    onClick={()=>setShowNewChatDialog(true)}
                    className="cursor-pointer"
                >
                    <MailPlus className="size-5"/>
                </Button>
            </div>

            {showNewChatDialog && (
                <NewChatDialog
                    onOpenChange={setShowNewChatDialog}
                    onChatCreated={()=>{
                        setShowNewChatDialog(false);
                        onClose();
                    }}
                />
            )}
        </>
    )
}

/*

Why does flex win over hidden above md when open is false?
Answer: It's not about md: inherently "beating" hidden, it comes down to two separate things: media query applicability and CSS source order. Explanation below

On mobile: md:flex is wrapped inside a @media (min-width: 768px) block. Below that width, the media query doesn't match, so that rule isn't active at all, it's not even in the running. The only rule that applies is plain .hidden { display: none }. So hidden wins simply because it's the only candidate.

Now On desktop: now the media query does match, so both rules are active simultaneously:

.hidden { display: none }

@media (min-width: 768px) {
  .md\:flex { display: flex }
}

Both selectors have identical specificity, each is a single class selector (specificity 0,1,0). When specificity is tied, CSS falls back to source order: whichever rule appears later in the stylesheet wins.
Tailwind is built so that all responsive variants (md:, lg:, etc.) are generated after the base utilities in the output CSS file, specifically so this works. That's a deliberate design choice by Tailwind, not a CSS default. Tailwind's compiler groups your utilities into layers and always emits the responsive-prefixed versions last, exactly so md:flex can override a same-specificity hidden at that breakpoint.
So the actual rule is: same specificity + later source position = wins, and Tailwind guarantees md:flex comes later. If you inspect the generated CSS output, you'd literally see .hidden defined near the top of the file and .md\:flex inside a media-query block much further down.

The same logic works for the ChatChannel too

*/