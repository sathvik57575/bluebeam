import { PostData } from "@/lib/types";
import { useDeletePostMutation } from "./mutations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { LoadingButton } from "../LoadingButton";
import { Button } from "../ui/button";

interface DeletepostDialogueprops {
    // className: string, //no need for styling from where we call it, we'll add all the styles here
    post: PostData,
    open: boolean,
    onClose: ()=>void
}


export default function DeletePostDialogue({
    post, open, onClose
}: DeletepostDialogueprops){

    const mutation = useDeletePostMutation();

    //The Dialog component's onOpenChange prop is triggered whenever the dialog's open state should change (like when clicking the backdrop or cancel cross symbol or anywhere outside or pressing Escape). By creating handleOpenChange, you're intercepting those close attempts to add custom logic instead of just putting onClose in there
    //we don't wanna allow to close it while we are already in an operation of deleting it.
    //we will define onClose and open(boolean variable) in the parent component(PostMoreButton.tsx) and pass it down here, so that we can control the open state of the dialog from the parent component
    function handlOpenChange(){
        if(!open || !mutation.isPending){ //actually we can remove !open too since it is redundant
            onClose();
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handlOpenChange}>
                <DialogContent className="sm:max-w-125 border-2 border-white/20 shadow-lg shadow-white/10">
                    <DialogHeader>
                        <DialogTitle>Delete post?</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this post? You can&apos;t undo this action</DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-6">
                        <LoadingButton loading={mutation.isPending} variant="destructive" onClick={()=>mutation.mutate(post.id, {onSuccess: onClose})} className="cursor-pointer">
                            Delete 
                        </LoadingButton>
                        <Button variant="outline" disabled = {mutation.isPending} onClick={onClose} className="cursor-pointer">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
        </>
    )
}