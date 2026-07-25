"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { getUserDataSelect } from "@/lib/types";
import { updateUserProfileSchema, UpdateUserProfileValues } from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues) {
    const validatedValues = updateUserProfileSchema.parse(values);

    const {user} = await validateRequest();

    if(!user) throw new Error("Unauthorized");

    const updatedUser = await prisma.user.update({
        where: {
            id: user.id
        },
        data: validatedValues,
        /*
        data: {
                displayName: abcd...,
                bio: abcd...    
            }
        //this is how it looks like if we want to update manually
        */
        select: getUserDataSelect(user.id)
    })

    await streamServerClient.partialUpdateUser({
        id: user.id,
        set:{
            name: user.displayName
        }
    })

    // if we want to we can wrap these 2 into a transaction as well, but not doing it. This is how we do it
    /*
    const updatedUser= await prisma.$transaction(async (tx)=>{
        const updatedUser = await tx.user.update({
            where: {
                id: user.id
            },
            data: validatedValues,
            select: getUserDataSelect(user.id)
        });

        await streamServerClient.partialUpdateUser({
            id: user.id,
            set:{
                name: validatedValues.displayName
            }
        })

        return updatedUser;
    })

    We are usong validatedValues.displayName since user is not created in prisma yet, and we should return from the inner async funtion too to catch it outside.
    */

    return updatedUser;
} 