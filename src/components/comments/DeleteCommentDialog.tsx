import { CommentData } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useDeleteCommentMutation } from "./mutations";
import { LoadingButton } from "../LoadingButton";
import { Button } from "../ui/button";

interface DeleteCommentDialogProps {
    comment: CommentData,
    open: boolean,
    onClose: ()=>void

}

export default function DeleteCommentDialog({comment, onClose, open}:DeleteCommentDialogProps){

    const mutation = useDeleteCommentMutation();

    function handleOpenChange(){
        if(!mutation.isPending){
            onClose();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete comment?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this comment? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <LoadingButton variant="destructive" loading={mutation.isPending} onClick={()=>mutation.mutate(comment.id, {onSuccess: onClose})} className="cursor-pointer">
                        Delete
                    </LoadingButton>

                    <Button variant={"outline"} onClick={onClose} disabled={mutation.isPending} className="cursor-pointer">
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}