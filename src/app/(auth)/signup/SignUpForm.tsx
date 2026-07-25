"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { signup } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";
import { LoadingButton } from "@/components/LoadingButton";

export default function SignUpForm() {
  //created later
  const [error, setError] = useState<string>();
  
  //transition
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignUpValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpValues) {
    setError(undefined); //reset error before new submission so we don't see previous errors
    startTransition(async()=>{
        const {error} = await signup(values);
        if(error){
            setError(error)
        }
  })

  /*we used startTransition to wrap the async function that calls the signup action. This allows React to treat the state updates inside that function as non-urgent, so if there are any pending updates (like showing a loading spinner), they can be rendered without waiting for the signup process to complete. The isPending variable can be used to conditionally render a loading state in the UI while the signup action is being processed. 
   When we did without using startTransition using a [loading, setLoading] states, the UI for submit button would freeze until the signup action completed, which is not a good user experience. By using startTransition, we can keep the UI responsive and provide feedback to the user while the signup process is happening in the background. I explained this in detail to myself in info1.txt.

    setIsLoading(true);
    const { error } = await signup(values); // redirect happens inside here
    setIsLoading(false); //this line causes UI freeeze
    if(error) setError(error);
    */
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {error && (
            <p className="text-center text-destructive">{error}</p>
        )}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* we explained this in info1.txt, we didn't use the latest <Field/> component from shadcn for reacthookform as it is too complex*/}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                {/* <Input placeholder="password" type="password" {...field} /> */}
                <PasswordInput placeholder="password" {...field} type="password"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <Button type="submit" className="w-full" disabled={isPending}>
          Create account
        </Button> */}
        <LoadingButton type="submit" loading={isPending} className="w-full cursor-pointer">
          Create account
        </LoadingButton>
      </form>
    </Form>
  );
}
