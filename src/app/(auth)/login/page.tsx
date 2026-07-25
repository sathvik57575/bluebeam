import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";
import loginimage from '@/assets/login-image.jpg'
import GoogleSignInButton from "./google/GoogleSignInButton";

export const metadata: Metadata = {
  title: "login",
};

export default function LoginPage() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-160 w-full max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold">Login to bluebeam</h1>
            <p className="text-muted-foreground">
              A place that turns strangers into family.
            </p>
          </div>

          <div className="space-y-5">

            {/* adding later */}
            <GoogleSignInButton/>
            <div className="flex in-checked: gap-3">
              <div className="h-px flex-1 bg-muted"></div>
              <span>OR</span>
              <div className="h-px flex-1 bg-muted"></div>
            </div>

            <LoginForm />
            <Link href="/signup" className="block text-center hover:underline">
               Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>

        <Image
          src={loginimage}
          alt=""
          className="hidden w-1/2 object-cover md:block"
          priority
        />
      </div>
    </main>
  );
}
