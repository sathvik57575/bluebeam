import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";

//this whole setup is required to authenticate user on stream as I did in the linguaflow project too.
export async function GET() {
  try {

    const {user} = await validateRequest();
    if(!user) return Response.json({error: "unauthorized"}, {status:401})

    console.log("calling get-token for user:", user.id);


    const expirationTime = Math.floor(Date.now()/1000) + 60*60;
    //adding 1hr to current time in seconds. So token will be valid for one hour, and it will refresh automatically, stream takes care of refreshing process

    const issuedAt = Math.floor(Date.now())/1000 -60;
    //subtracting one minute here because if we don't there might be a time difference between server and client, subtracting 1 min fixes the time difference because now we pretend this token was issued 1 min earlier

    const token = streamServerClient.createToken(
        user.id,
        expirationTime,
        issuedAt
    )

    return Response.json({token});

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
