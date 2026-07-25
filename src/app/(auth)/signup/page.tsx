import { Metadata } from "next";
import signupimage from "@/assets/signup.jpg";
import Image from "next/image";
import Link from "next/link";
import SignUpForm from "./SignUpForm";
import GoogleSignUpButton from "./google/GoogleSignUpButton";

export const metadata: Metadata = {
  title: "Signup",
};

export default function SignupPage() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-160 w-full max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold">Welcome to bluebeam</h1>
            <p className="text-muted-foreground">
              A friendly corner of the internet where you belong
            </p>
          </div>

          <div className="space-y-5">

            {/* adding later */}
            <GoogleSignUpButton/>
            <div className="flex in-checked: gap-3">
              <div className="h-px flex-1 bg-muted"></div>
              <span>OR</span>
              <div className="h-px flex-1 bg-muted"></div>
            </div>

            <SignUpForm />
            <Link href="/login" className="block text-center hover:underline">
              Already have an account? Click here to Log in
            </Link>
          </div>
        </div>

        <Image
          src={signupimage}
          alt=""
          className="hidden w-1/2 object-cover md:block"
          priority
        />
      </div>
    </main>
  );
}
