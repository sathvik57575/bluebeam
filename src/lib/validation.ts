import {z} from 'zod';

/*
export const signUpSchema = z.object({
    email: z.string().trim().min(1, "Required").email("Invalid email address"),

    username:  z.string().trim().min(1, "Required").regex(
        /^[a-zA-Z0-9_-]+$/,
        "only letters, numbers, -, _ are allowed"
    ),
    password:  z.string().trim().min(5, "Must be atleast 5 characters")
})

since  z.string().trim().min(1, "Required") is being repeated, we can create a helper function to avoid repetition lol.
AlSO we write the errors in the brackets as strings, which means if that condition is not satisfied, that error message will be shown.
EG: min(1, "Required"), if min length<1(0) 'Required' error message will be shown.
email("Invalid email address"), if email input is not the form x@y.com, then 'Invalid email address' error message will be shown.
same logic for other validation error messages
*/
const requiredString =  z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
    email: requiredString.email("Invalid email address"),

    username:  requiredString.regex(
        /^[a-zA-Z0-9_-]+$/,
        "only letters, numbers, -, _ are allowed"
    ),
    password:  requiredString.min(5, "Must be atleast 5 characters")
    //since we're essentially doing .min(1).min(5) the latest one applies, somin = 5 applies.
})


export type SignUpValues = z.infer<typeof signUpSchema>;
//exporting type of the schema, so we can use it in other files(frontend signup form) for type checking and autocompletion.
/*
When you define a zod schema:
export const signUpSchema = z.object({
    email: requiredString.email(),
    username: requiredString,
    password: requiredString.min(5)
})
Zod already knows the shape of your data. z.infer just extracts that shape as a TypeScript type so you don't have to write it twice:
Without z.infer, you'd have to manually write:
export type SignUpValues = {
    email: string;
    username: string;
    password: string;
}
// With z.infer, TypeScript figures it out automatically:
export type SignUpValues = z.infer<typeof signUpSchema>;
// exact same result, but automatic

So if you add a field to the schema, the type updates automatically. No manual syncing needed. You then use it to type your form data:
// in the signup form component
function SignUpForm() {
    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema)
    })
}
*/




//creating and exporting the login schema
export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;




//creating and exporting the post creation schema
export const createPostSchema = z.object({
    content: requiredString,

    //we will later add types of media attachments, but for now we will just validate the content of the post.

    mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments")
})


export const updateUserProfileSchema = z.object({
    displayName: requiredString,
    bio: z.string().max(1000, "Must be a maximum of 1000 characters")
})

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>


export const createCommentSchema = z.object({
    content: requiredString
})

//we don't need this as we won't be passing this anywhere, since in the server actions file we'll get both content and post as argumets, so this is redundant. And we won't react hook form either
// export type createCommentValues = z.infer<typeof createCommentSchema>