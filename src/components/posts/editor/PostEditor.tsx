"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PlaceHolder from "@tiptap/extension-placeholder";
import { submitPost } from "./actions";
import { UserAvatar } from "@/components/UserAvatar";
import { useSession } from "@/app/(main)/SessionProvider";
import { Button } from "@/components/ui/button";
import "./styles.css";
import { useSubmitPostMutation } from "./mutations";
import { LoadingButton } from "@/components/LoadingButton";
import useMediaUpload, { Attachment } from "./useMediaUpload";
import { ClipboardEvent, useRef } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "@uploadthing/react";

export default function PostEditor() {
  const { user } = useSession();

  const mutation = useSubmitPostMutation();

  //adding this later
  const {
    startUpload,
    isUploading,
    attachments,
    uploadProgress,
    removeAttachment,
    reset,
  } = useMediaUpload();


  //for drag and drop uploads 
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop: startUpload
    //ondrop passes us the files we drop in here, and startupload takes them, so basically onDrop is just a wrapper for startupload, it calls startupload with the argument files, so we can just pass startupload. We saw this previously. So onDrop is like onUploadProgress: setUploadProgress or onOpenChange={onOpenChange}
    //rest of the getRootProps and getInputProps and isDragActive explained in info6.txt
  });

  const {onClick, ...rootProps} = getRootProps();


  //creating the editor object which is displayed on the screen using the useEditor hook from tiptap. The editor object that is returned from this hook contains all the methods and properties we need to interact with the editor, such as getting the content, setting the content, etc.
  const editor = useEditor({
    immediatelyRender: false /*without this error occurs, Tiptap detects it's being rendered on the server (SSR) and wants you to explicitly handle it.
        Even though PostEditor.tsx has "use client", Next.js still pre-renders client components on the server for the initial HTML (SSR). Tiptap detected this and threw an error because its default behavior is to render immediately, which causes a mismatch between server-rendered HTML and client-rendered HTML (hydration mismatch).
        Setting immediatelyRender: false tells Tiptap:
        "Don't render on the server, wait until the component is fully hydrated on the client"
        This is the recommended fix from Tiptap's own docs for Next.js projects.
        */,

    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      PlaceHolder.configure({
        placeholder: "What's on your mind today?",
      }),
    ],

    shouldRerenderOnTransaction: true, // tells to re-render component on every keystroke so `input` stays updated. If we didn't use immediatelyRender: false, then we don't need this. But in the latest tiptap version we need immediatelyRender: false for it not throw an error, so we have to use this too. Or else our button disabling will not work when our input is empty or just spaces. Now with this, when our input is empty of just whitespaces, the button will be disabled, and when we type something, it will be enabled. This is because the input variable is updated on every keystroke, so when it's empty or just spaces, input.trim() will be an empty string, which is falsy, so the button will be disabled. When we type something, input.trim() will be a non-empty string, which is truthy, so the button will be enabled.
  });



  //this contains the input content of the editor, we will use this to submit the post content to the server when the user clicks the submit button. We will also use this to show a preview of the post content as the user types. The getText method of the editor instance returns the plain text content of the editor, without any HTML tags or formatting. We can also pass an options object to getText to specify how we want the text to be formatted. In this case, we're using blockSeparator: "\n" to specify that we want each block of text (e.g. paragraphs) to be separated by a newline character in the resulting string. This means that if the user types multiple paragraphs in the editor, they will be separated by newlines in the input string that we get from editor.getText(). If we didn't specify blockSeparator, the default behavior would be to concatenate all blocks of text together without any separation.
  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";


  //previous onSubmit function before we did tanstack query cache mutation
  /*
    async function onSubmit() {
      await submitPost(input);
      editor?.commands.clearContent();
    }
  */
  function onSubmit (){
    /*
    mutation.mutate(input, {
      onSuccess(){
        editor?.commands.clearContent();
      }
    });
    */

    mutation.mutate(
      {
        content: input,
        mediaIds: attachments.map((a) => a.mediaId).filter((v): v is string => !!v),

          //we can also do this, same thing, explained in info6.txt
          //mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[],
      },
      {
        onSuccess() {
          editor?.commands.clearContent();
          reset(); //resetting the attachments after the post is submitted, so that the user can upload new attachments for the next post. This will clear the attachments state in the useMediaUpload hook, so that the user can upload new attachments for the next post.
        },
      },
    );
  }


  //creating a copy-paste files feature
  function onPaste(e: ClipboardEvent<HTMLInputElement>){
    const files = Array.from(e.clipboardData.files);
    if(files.length){
      startUpload(files);
    }
  }



  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex gap-5">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          className="size-7.5 sm:size-12"
        />


        <div {...rootProps} className="w-full"> {/* we are later wrapping this Editor content in an outer div for implementing drag and drop, and adding an input tag below for it. We are adding a dotted-border for the EditorContent component when we drop a file, so we're wrapping the className in cn(). And one more change is that we are also adding an onPaste event listenter to this for copy-pasting files */}
          <EditorContent
            editor={editor}
            className={cn("w-full max-h-80 overflow-y-auto bg-background rounded-xl px-5 py-3", isDragActive && "outline-dashed outline-black")}
            onPaste={onPaste}
          />
          <input {...getInputProps()}/>
        </div>

      </div>

      {/* here I am doing !!attachments.length && () instead of attachments.length && (), explained in info6.txt  */}
      {!!attachments.length && (
        <AttachmentPreviewList
          attachments={attachments}
          removeAttachment={removeAttachment}
        />
      )}

      <div className="flex justify-end cursor-pointer gap-3 items-center">
        {isUploading && (
          <>
            <span className="text-sm">{uploadProgress ?? 0}%</span>
            <Loader2 className="animate-spin text-primary size-5" />
          </>
        )}

        {/* added later for file attachments */}
        <AddAttachmentsButton
          onFilesSelected={startUpload}
          disabled={isUploading || attachments.length > 5}
        />

        <LoadingButton
          loading={mutation.isPending}
          onClick={onSubmit}
          disabled={!input.trim() && isUploading}
          className="min-w-20 cursor-pointer text-white"
        >
          Post
        </LoadingButton>
        {/* previously we used a simple <Button> component from shadcn, now we are using <LoadingButton>(we built this) after we used useMutation() hook as we now have a loading(isPending) state. only difference is now it will show a loading symbol when post is submitting */}
      </div>
    </div>
  );
}



//creating the upload files button
interface AddAttachmentsButtonProps {
  onFilesSelected: (files: File[])=>void,
  disabled: boolean
}

function AddAttachmentsButton({disabled, onFilesSelected}: AddAttachmentsButtonProps){

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button variant="ghost" size="icon" className="text:primary hover:text-primary cursor-pointer" disabled={disabled} onClick={()=>fileInputRef.current?.click()}>
        <ImageIcon size={20}/>
      </Button>
      <input type="file" ref={fileInputRef} accept="image/*, video/*" multiple className="hideen sr-only" onChange={(e)=>{
        const files = Array.from(e.target.files || []);
        //we have to specify the || [] values because e.target.files is typed as FileList | null, and Array.from() does not accept null. So files can be empty too bruh
        if(files.length){
          onFilesSelected(files);
          e.target.value=""; //resetting the input value so that the same file can be selected again if needed. This is because if we don't reset the value, then if the user selects the same file again, the onChange event will not fire, since the value of the input is still the same as before. So we reset it to an empty string, so that the next time the user selects a file, it will be different from the previous value, and the onChange event will fire.
        }

      }}/>
    </>
  )
}


//creating a preview for each attachment in the PostEditor, so that the user can see what files he has selected until now or before submitting the post. This will have a remove(X) button to remove the file too. 
interface AttachmentPreviewProps{
  attachment: Attachment
  onRemoveClicked: ()=>void
}

export function AttachmentPreview({attachment, onRemoveClicked}: AttachmentPreviewProps){

  const src = URL.createObjectURL(attachment.file);

  return (
    <div className={cn("relative mx-auto size-fit", attachment.isUploading && "opacity-50")}>
        {attachment.file.type.startsWith("image")? (
          <Image src={src} alt="AttachmentImage" width={500} height={500} className="size-fit max-h-120 rounded-2xl"/>
        ):(
          <video controls className="size-fit max-h-120 rounded-2xl">
            <source src={src} type={attachment.file.type}/>
          </video>

          // we can also do this <video controls className="size-fit max-h-120 rounded-2xl" src={src}/>, but this is buggy since this reloads the image everytime the component re-renders, so the video will start from the beginning everytime the component re-renders, which is not what we want. So we use <source> tag instead, which doesn't reload the video everytime the component re-renders.
        )}

        {!attachment.isUploading && (
          <button className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60 cursor-pointer" onClick={onRemoveClicked}>
            <X size={20}/>
          </button>
        )} 
    </div>
  )
}


//creating a list of attachment previews, we don't need this, we can just map over the attachments array in the Posteditor component, but we're doing this for better optimization, and also so that the list of attachments doesn't re-render everytime the PostEditor component re-renders. This is because the list of attachments is a separate component, so it will only re-render when the attachments array changes, not when the PostEditor component re-renders. This is a good practice to follow according to stack overflow, to keep the components as small and focused as possible, so that they don't re-render unnecessarily.
interface AttachmentPreviewListProps {
  attachments: Attachment[],
  removeAttachment: (filename: string) => void
}

function AttachmentPreviewList({attachments, removeAttachment}: AttachmentPreviewListProps){

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        attachments.length > 1 && "sm:grid sm:grid-cols-2",
      )}
    >
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.file.name}
          attachment={attachment}
          onRemoveClicked={() => removeAttachment(attachment.file.name)}
        />
      ))}
    </div>
  );
}