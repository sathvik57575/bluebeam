import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

/*
Also I've learned this just now, we should just export function instead of doing export default.
export default makes it the default export. Next.js doesn't recognize it as a route handler. Named export async function PATCH is what Next.js looks for to register the PATCH method.
This makes sense since there will be GET, POST, PATCH, PUT, DELETE methods in this file, and we need to export them all using names exports instead of using default exports for only one function
*/
export async function PATCH(){
    try {
        const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
        where: {
            recipientId: user.id,
            read: false //not needed, since it is false by default
        },
        data:{
            read: true
        }
    })

    return new Response();

    } catch (error) {
        console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}