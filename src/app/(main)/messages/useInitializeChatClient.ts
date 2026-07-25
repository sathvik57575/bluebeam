import { useEffect, useState } from "react";
import { useSession } from "../SessionProvider";
import { StreamChat } from "stream-chat";
import { kyInstance } from "@/lib/ky";

//here we're initiliazing the stream chat client
export default function useInitializeChatClient(){
    const {user} = useSession();

    const [chatClient, setChatClient] = useState<StreamChat | null>(null);

    //the initialization happens in a useEffect as we did in linguaflow
    useEffect(()=>{
        //creating client
        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!);
        //we don't secret here as this is frontend, we should only use secret on backend for safety

        client.connectUser({
            id: user.id,
            username: user.username,
            name: user.displayName,
            image: user.avatarUrl ?? undefined
        },
        
        async ()=> {
            const {token} = await kyInstance.get('/api/get-token').json<{token:string}>();
            return token
        },
        /*we can do like this too, just returning the token, we just used token directly in linguaflow instead of returning it from a function as we fetched it above.
        async ()=> kyInstance.get('/api/get-token').json<{token:string}>()
        .then(data=>data.token)
        */
    )
    .catch(error=> console.log("failed to connect user to stream", error))
    .then(()=>setChatClient(client))

    //we're cleaning up the useEffect here, we can do that by returning a function from useEffect, this function will run the next time useEffect runs. Explained in detail below
    return ()=>{
        setChatClient(null);
        client.disconnectUser()
        .catch((error)=>console.log("failed to disconnect user", error))
        .then(()=>console.log("connection closed"))
    }
    },[user.id, user.displayName, user.username, user.avatarUrl])

    return chatClient;
}

/*
in the useeffect dependency, we're writing individual fields instead of user object itself. Initially when I wrote user it was causing re-renders.
React's useEffect compares each dependency between renders using Object.is (basically ===). For primitives (strings, numbers), this compares by value. For objects, this compares by reference.

user is an object coming from useSession(). Even if the actual user data hasn't changed, if SessionProvider re-renders and creates a new user object (a new object literal, even with identical fields), React sees it as a different object, because it's a new reference in memory. So [user] as a dependency would cause the effect to re-run on every re-render of SessionProvider, not just when the user's actual info changes.
By destructuring to user.id, user.displayName, user.username, user.avatarUrl, you're comparing primitive strings. "abc123" === "abc123" is true regardless of which object it came from. So the effect only re-runs when one of these specific values actually changes, which is what you want, since reconnecting to Stream is expensive (tears down the WebSocket connection and rebuilds it).

// Render 1
const user = { id: "1", name: "Alice" };

// Render 2 (SessionProvider re-renders, new object created, same data)
const user = { id: "1", name: "Alice" };

user === user // false! different references
user.id === user.id // true, same string value


Next is the cleanup function we are returning from useEffect. By returning a function from useEffect we can clean it up. And in that function we are disconnecting the user from stream. But why? What are we achieving by disconneting to stream? won't it cause the chat to not work?

That cleanup function isn't about breaking the chat. It's about preventing duplicate/stale connections.

When does the cleanup run? Two cases:
The component unmounts (user navigates away from the messages page)
The effect re-runs because a dependency changed (e.g., user.displayName changes) . React runs cleanup from the previous effect before running the new effect

Why disconnecting matters in case 2 (the sneaky one):
Say the user updates their display name while on the chat page. Your dependency array [user.id, user.displayName, ...] changes, so the effect re-runs:
Without cleanup:
1. Old client connects with old name (still connected in background)
2. New client connects with new name
→ Now you have TWO active WebSocket connections to Stream for the same user
That's a leaked connection — wasted resources, potentially duplicate event listeners firing twice (e.g., "new message" handlers), weird bugs where things happen twice.
With cleanup:
1. Old client connects with old name 
2. Dependency changes → cleanup runs → disconnectUser() on old client
3. New client connects with new name 
→ Exactly one active connection
Why disconnecting on unmount matters:
If you navigate to /messages, then to /profile, without disconnecting, the WebSocket connection stays open in the background — Stream still thinks you're "present," you're still consuming a connection slot, and if you navigate back to /messages, useInitializeChatClient runs again and creates a second connection on top of the still-open first one.
Does using disconnect break anything? No quite the opposite. disconnectUser() closes that specific client instance's connection. It doesn't delete your account, your messages, or your channels on Stream's servers — those are persisted server-side. Next time you connect (new client instance), you reconnect and pick up right where you left off, full message history intact.
So the pattern is: every time you create a connection, you register how to tear down that exact connection, that's just standard resource-cleanup hygiene, same idea as closing a database connection or removing an event listener.
*/