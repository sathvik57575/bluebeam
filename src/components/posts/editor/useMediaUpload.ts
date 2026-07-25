import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react"
import { toast } from "sonner";

export interface Attachment {
    file: File
    mediaId?: string
    isUploading: boolean
}

//we use this custom hook in the PostEditor.tsx to handle media uploads. This internally uses useUploadThing hook from uploadthing library, but we are adding some custom logic to handle the media uploads and manage the state of the attachments. This is because we want to have a maximum of 5 attachments per post, and we want to show the upload progress for each attachment, and we want to be able to remove an attachment before it is uploaded(before post is sent), and we want to be able to reset the attachments after a post is submitted. So we are wrapping the useUploadThing hook in this custom hook to add this functionality.
export default function useMediaUpload(){
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const [uploadProgress, setUploadProgress] = useState<number>();

    const {startUpload, isUploading} = useUploadThing("attachment", {
        onBeforeUploadBegin(files) {
            const renamedFiles = files.map((file) => {
                const extention = file.name.split(".")[1];

                return new File(
                  [file],
                  `attachment_${crypto.randomUUID()}.${extention}`,
                  { type: file.type },
                );
            })

            setAttachments((prev)=>{
                return [
                    ...prev,
                    ...renamedFiles.map((file)=>({file, isUploading: true}))
                ]}
            )
            /*
            we can even write 
            setAttachments((prev)=>{
                return [
                    ...prev,
                    ...renamedFiles.map((f)=>({file: f, isUploading: true}))
                ]}
            )
            Previously since the key name and variable name are same, we can just write file instead of file: file, but here since they are different we have to write them manually.
            */

            return renamedFiles;
            //onBeforeUploadBegin is an interceptor, whatever you return from here is what UploadThing actually uploads, instead of the original files. So if you don't return the renamed files, UploadThing just uses the originals with their original names. 
        },

        onUploadProgress: setUploadProgress,
        //so we can just pass this function here, it calls the setUploadProgress function with the progress value(number), so the updateProgress state will be updated with the progress value, which we can use to show the progress bar in the UI. This is like automaically calling setUploadProgress(progress) for us, we don't have to do it manually. The progress is passes by the onUploadProgress automatically.
        // Same pattern as onOpenChange={setShowDialogue}. Explained more in info6.txt

        onClientUploadComplete(res) {
            console.log("media client upload complete");

            setAttachments((prev)=>{
                return prev.map((attachment)=>{
                    //finding the uploaded result for this attachment, since the res array contains all the uploaded files, we need to find the one that matches this attachment's file name. We can do this by comparing the name of the file in the res array with the name of the file in the attachment object. We do this for the mediaId, more in the infp6.txt file.
                    const uploadResult = res.find((r)=>r.name == attachment.file.name)
                    
                    if(!uploadResult) return attachment;

                    return {
                        ...attachment, 
                        mediaId: uploadResult.serverData.mediaId,
                        isUploading: false
                    }
                })
            })
        },

        onUploadError(e) {
            setAttachments((prev)=> prev.filter((attachment)=>{
                return attachment.isUploading == false
            }))
            //so here we are removing the attachments that are still uploading, since they failed to upload, so we don't want to keep them in the attachments array. We only want to keep the ones that have already been uploaded successfully.
            //can even write it as  
            //setAttachments((prev)=> prev.filter((attachment)=> attachment.isUploading==false)) or 
            //setAttachments((prev)=> prev.filter((attachment)=> !attachment.isUploading))

            toast.error(e.message)
        },
    })


    function handleStartUpload(files: File[]){
        if(isUploading){
            toast.error("Already uploading files, please wait for the current upload to finish before starting a new one.")
            return;
        }

        if(attachments.length + files.length > 5){
            toast.error("You can only upload up to 5 attachments per post.")
            return;
        }

        startUpload(files);
    }

    function removeAttachment(filename: string){
        setAttachments((prev)=> prev.filter(attachment=> attachment.file.name!=filename));
        return;

        //removeAttachment only removes React state, it does NOT delete UploadThing file. It only removes preview. Database cleanup usually happens later if user never posts.
    }

    function reset(){
        setAttachments([]);
        setUploadProgress(undefined);
    }


    return {
        startUpload: handleStartUpload, //not the startUpload from the useUploadTHing, but the function we created, we're renaming it.
        isUploading,
        attachments,
        uploadProgress,
        removeAttachment,
        reset
    }
}

