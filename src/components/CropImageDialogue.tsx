import { useRef } from "react"
import {Cropper, ReactCropperElement} from "react-cropper"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import "cropperjs/dist/cropper.css";

interface CropImageDialogueProps {
    src: string,
    cropAspectRatio: number,
    onCropped: (blob: Blob|null)=>void,
    onClose: ()=>void
}

export default function CropImageDialogue({src, cropAspectRatio, onCropped, onClose}:CropImageDialogueProps){
    
    const cropperRef = useRef<ReactCropperElement>(null);

    //cropping function
    function crop(){
        const cropper = cropperRef.current?.cropper;
        if(!cropper) return;
        cropper.getCroppedCanvas().toBlob((blob)=>onCropped(blob), "image/webp");
        onClose();
    }

    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="overflow-y-auto max-h-[100vh]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          <Cropper
            src={src}
            aspectRatio={cropAspectRatio}
            guides={false}
            zoomable={false}
            ref={cropperRef}
            className="mx-auto size-fit"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={crop}>Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}