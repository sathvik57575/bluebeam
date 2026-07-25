import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { userData } from "@/lib/types";
import { updateUserProfileSchema, UpdateUserProfileValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useUpdateProfileMutation } from "./mutations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/LoadingButton";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import avatarPlaceholder from "@/assets/avatar-placeholder.png" //always write @/assets instead of @assets
import { Camera } from "lucide-react";
import CropImageDialogue from "@/components/CropImageDialogue"
import Resizer from "react-image-file-resizer";


interface EditProfileDialogueProps {
    user: userData;
    open: boolean; //this is a prop called open(value = true/false)
    onOpenChange: (open: boolean)=>void  //"open" here is just a parameter name, we can call it anything like xyz, it different from the open above, onOpenChange here is basically the setShowDialogue in the EditProfileButton. And since we call setShowDialogue like this: setShowDialogue(true) or setShowDialogue(false), and it doesn't return anything(void). So there for the type/structure of setShowDialogue/onOpenChange is a function like this: (parameter: boolean)=>void
}


export default function EditProfileDialogue({user, open, onOpenChange}: EditProfileDialogueProps){

    const form = useForm<UpdateUserProfileValues>({
        resolver: zodResolver(updateUserProfileSchema),
        defaultValues: {
            displayName: user.displayName,
            bio: user.bio || ""
        }
    })

    const mutation = useUpdateProfileMutation();

    
    //adding later for avatar input
    const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);


    async function onSubmit(values: UpdateUserProfileValues) {

        console.log("croppedAvatar:", croppedAvatar) //this should not be null

        const newAvatarFile = croppedAvatar? new File([croppedAvatar], `avatar_${user.id}.webp`, {type: "image/webp"}) : undefined

         console.log("newAvatarFile:", newAvatarFile)  // this shouldn't be undefined
         console.log(values);

        mutation.mutate({
            values,
            avatar: newAvatarFile //added later
        },{
            onSuccess: ()=>{
                onOpenChange(false);
            }
        })
    }
    

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Avatar</Label>
            
            <AvatarInput
              src={
                croppedAvatar
                  ? URL.createObjectURL(croppedAvatar)
                  : user.avatarUrl || avatarPlaceholder
              }
              onImageCropped={setCroppedAvatar}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your displayname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your bio"
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <LoadingButton
                  loading={mutation.isPending}
                  type="submit"
                  className="cursor-pointer"
                >
                  Save
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
}



interface AvatarInputProps {
    src: string | StaticImageData
    // so we want to show the previous avatar image of the user, and when we click on it we should be able to select a new image.
    //And the previous image can be an actual image url coming from the avatarUrl(user.avatarUrl, if we already uploaded one), or the default avatar image in the assets/avatar-placeholder.png. All users have default avatar-placeholder.png at start.
    // So the type of image is either string(the url link of uploadthing) or StaticImageData(it means it is a file of type image, so an image file)


    onImageCropped: (blob: Blob | null)=>void
}


function AvatarInput({src, onImageCropped}: AvatarInputProps){
    const [imageToCrop, setImageToCrop] = useState<File>();

    const fileInputRef = useRef<HTMLInputElement>(null); //initializing with null;

    function onImageSelected(image: File|undefined){
        if(!image) return;

        //will do in a moment
        Resizer.imageFileResizer(
            image,
            1024,
            1024,
            "WEBP",
            100,
            0,
            (uri)=> setImageToCrop(uri as File),
            "file"
        )

    }

    return (
      <>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageSelected(e.target.files?.[0])}
          ref={fileInputRef}
          className="hidden sr-only"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative block cursor-pointer"
        >
          <Image
            src={src}
            alt="Avatar Preview"
            width={150}
            height={150}
            className="size-32 flex-none rounded-full object-cover"
          />
          <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-black/30 text-white transition-colors duration-200 group-hover:bg-black/25">
            <Camera size={24} />
          </span>
        </button>

        {imageToCrop && (
          <CropImageDialogue
            src={URL.createObjectURL(imageToCrop)}
            cropAspectRatio={1}
            onCropped={onImageCropped}
            onClose={() => {
              setImageToCrop(undefined);
              if(fileInputRef.current){
                fileInputRef.current.value = ""
              }
            }}
          />
        )}
      </>
    );
}