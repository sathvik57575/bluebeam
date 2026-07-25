import ky from "ky";

const kyInstance = ky.create({
    parseJson:(text) => {
        return JSON.parse(text, (key, value)=>{
            if(key.endsWith('At')){
                return new Date(value);
            }
            return value;
        })
    },
})

export {kyInstance}

/*
We are overriding how ky converts response text → JavaScript object
Default behavior (what ky normally does)
Normally when we do this - ky.get(...).json()
it internally does:
JSON.parse(responseText)

What I changed
I replaced it with:
JSON.parse(text, (key, value) => { ... }), syntax is JSON.parse(text, reviver)
That second argument is called a reviver function
What a reviver does is 
Runs on every key-value pair while parsing JSON

Our reviver logic
if (key.endsWith('At')) {
  return new Date(value);
}
Meaning whenever a field like:
{
  "createdAt": "2026-04-23T10:00:00.000Z"
}
or
{
   updatedAt": "2026-04-23T10:00:00.000Z"
}

it is parsed and it becomes:
createdAt: Date object, NOT a string

So here we are converting strings back to date on the client side.
*/