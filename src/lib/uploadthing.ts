import { appFileRouter } from "@/app/api/uploadthing/core"
import {generateReactHelpers} from "@uploadthing/react"

export const {useUploadThing, uploadFiles} = generateReactHelpers<appFileRouter>();