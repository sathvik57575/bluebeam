"use client"

import { Button } from "@/components/ui/button";
import { userData } from "@/lib/types";
import { useState } from "react";
import EditProfileDialogue from "./EditProfileDialogue";

interface EditProfileButtonProps {
    user: userData
}

export default function EditProfileButton({user}:EditProfileButtonProps){
    
    const [showDialogue, setShowDialogue] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={()=>setShowDialogue(true)} className="cursor-pointer">Edit Profile</Button>

            <EditProfileDialogue user={user} open={showDialogue} onOpenChange={setShowDialogue}/>
            {/* onOpenChange={setShowDialogue} is same as writing onOpenChange = {(false)=>setShowDialogue(false)} 
            Passing setShowDialogue directly to onOpenChange is a clean and common React pattern.
            In JavaScript, functions are first-class citizens. This means you can pass a function as a prop just like any other variable.When the EditProfileDialogue component decides to close, it calls onOpenChange and passes a boolean value (usually false) into it. Writing onOpenChange={setShowDialogue} means that value goes directly into React's state setter.It behaves exactly like writing: onOpenChange={(newValue) => setShowDialogue(newValue)}.
            But why is it passing only false instead of true? We'll see in the EditProfileDialogue.tsx, explained in info6.tsx
            */}
        </>
    )
}

/*
What if it was one component for better understanding?

export default function EditProfileButton({ user }) {

    const [showDialogue, setShowDialogue] = useState(false);

    const form = useForm<UpdateUserProfileValues>({
        resolver: zodResolver(updateUserProfileSchema),
        defaultValues: {
            displayName: user.displayName,
            bio: user.bio || ""
        }
    })

    const mutation = useUpdateProfileMutation();

    async function onSubmit(values: UpdateUserProfileValues) {
        mutation.mutate({
            values
        },{
            onSuccess: ()=>{
                setShowDialogue(false);
            }
        })
    }

    return (
        <>
            <Button onClick={() => setShowDialogue(true)}>Edit Profile</Button>

            <Dialog open={showDialogue} onOpenChange={setShowDialogue}>
                <DialogContent>
                    ... the whole form here ...
                </DialogContent>
            </Dialog>
        </>
    )
}

<Dialog open={showDialogue} onOpenChange={setShowDialogue}>
This is still setShowDialogue directly, same as before, just without the rename that confused you earlier. When you split it into two components, you passed setShowDialogue as a prop and called it onOpenChange inside the child. That renaming was the source of the confusion. In one component there's no rename, it's just setShowDialogue everywhere, which makes it much clearer that it's all the same function doing the same thing.

In the EditProfileDialogue.tsx
When we do onOpenChange={setShowDialogue}>(one component) or onOpenChange={onOpenChange}>(separate components) what's happening is, when the backdrop/cancel is clicked, the shadcn Dialog calls the function inside onOpenChange attribute(which is setShowDialogue or onOpenChange prop(which is also setShowDialogue)) with a boolean value false. So it means this is happening: setShowDialogue(false); which sets showDialogue to false and the Dialog box closes.
So instead of onOpenChange={setShowDialogue}> we can even do onOpenChange={(value)=>setShowDialogue(value)}> 
or instead of this onOpenChange={onOpenChange}> we can do onOpenChange={(value)=>onOpenChange(value)}>
Which means, the onOpenChange attribute of the Dialog passes a value and calls setShowDialogue with that.
So it's giving the incoming boolean a name (value), then forwarding it into setShowDialogue. That's exactly what onOpenChange={setShowDialogue} does under the hood — just more verbose.

But we cannot do 
onOpenChange={()=>setShowDialogue()} — ❌ broken. Two reasons:
setShowDialogue() with no argument sets state to undefined
The arrow function ignores the boolean Dialog passes in, so backdrop/Escape clicks stop working

onOpenChange={(false)=>setShowDialogue(false)} — ❌ invalid syntax. false is a value, not a parameter name. Parameters must be identifiers like value or isOpen. LOGIC bruh.

So we can do <EditProfileDialogue user={user} open={showDialogue} onOpenChange={(value)=>setShowDialogue(value)}/>
or in the EditProfileDialogue, we can do 
return (
        <Dialog open={open} onOpenChange={(value)=>onOpenChange(value)}>
Since the Dialog's onOpenChange attribute calls whatever function is in it with false when cross/backdrop is clicked, so here the function inside is also onOpenChange(this is the prop we passed, not the Dialog's attribute), onOpenChange attribute calls onOpenchange function with false, like this: onOpenChange(false)
So onOpenChange={(value)=>onOpenChange(value)} and onOpenChange={onOpenChange} are the same.
onOpenChange={(value)=>onOpenChange(value)} means the onOpenChange Dialog's onOpenChange attribute calls this function 
called (value)=>onOpenChange(value), with value = false, so internally it calls onOpenChange(false)
Same end result, different path. The second one(()=>onOpenChange()) has one extra hop through the anonymous function before reaching onOpenChange. Same outcome, tiny unnecessary overhead. That's why passing the function reference directly (first) is the cleaner pattern — no middleman.
*/