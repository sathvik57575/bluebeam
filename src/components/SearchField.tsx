"use client";

import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";

export function SearchField() {
  const router = useRouter();

  const handlesubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    console.log({...e}); //just printing clg(e) is showing e as a generic object, but when we spread it like this, we can see the actual properties of the event object. This is a common technique to inspect the properties of an event in React, especially when the event object is complex or has a lot of properties. By spreading the event object into a new object, we can easily see all its properties and their values in the console. 
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim(); //we can even write form.elements.q.value, but this is a bit more type-safe because we are explicitly telling TypeScript that form.q is an HTMLInputElement, so we can access the value property without any type errors. If we just write form.q.value, TypeScript might not know what type form.q is and could throw an error when we try to access the value property. By using a type assertion like this, we are telling TypeScript exactly what type form.q is, which allows us to access its properties without any issues.
    if (!q) return; //so when the search is empty or just empty spaces, we don't do anything
    router.push(`/search?q=${encodeURIComponent(q)}`); //here encodeURIComponent is used to encode the search query so that it can be safely included in the URL. This is important because search queries can contain special characters that might interfere with the URL structure, such as spaces, ampersands, question marks, etc. By encoding the query, we ensure that it is properly formatted for inclusion in the URL and that it will be correctly interpreted by the server when the request is made. eg: if the user searches for "hello world", without encoding, the URL would be /search?q=hello world, which is not valid because of the space. With encoding, it becomes /search?q=hello%20world, which is valid and will work correctly. Similary if the user types #sathvik it will without encoding become /search?q=#sathvik, which is not valid because of the # character. With encoding, it becomes /search?q=%23sathvik, which is valid and will work correctly. So it's always a good practice to encode any user input that is included in a URL to avoid potential issues with special characters.
  };

  return (
    <form onSubmit={handlesubmit} method="GET" action={"/search"}>
      <div className="relative">
        <Input name="q" placeholder="Search" className="pe-10" />
        <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </div>
    </form>
    //we submit form by pressing enter key, so we don't need a submit button. This is a common pattern for search fields, where the user types their query and then presses enter to submit the form. The onSubmit handler will automatically be triggered when the form is submitted by pressing enter. BUT THIS DOESN'T ALWAYS HAPPEN.  If a form contains exactly one single-line text input field, pressing Enter will submit the form even if there is no submit button present at all. If the form contains two or more text fields and completely lacks a designated submit button, pressing Enter does nothing. If the user is actively typing inside a <textarea> element, pressing Enter creates a new line instead of submitting the form. AND if the default submit button has a disabled attribute attached to it, implicit enter click submission is blocked.
  );
}
