import { Button } from "@/components/ui/button";
import { GoogleIcon } from "../../login/google/GoogleSignInButton";

export default function GoogleSignUpButton(){
    return (
        <Button
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 hover:text-black dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:hover:text-black"
            asChild
        >
            <a href="/signup/google" className="flex w-full items-center gap-2">
                <GoogleIcon/>
                Sign up with Google
            </a>
        </Button>
    )
}