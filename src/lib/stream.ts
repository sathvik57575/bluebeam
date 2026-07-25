import {StreamChat} from "stream-chat"

const streamServerClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_KEY!,
    process.env.STREAM_SECRET
)
//adding the ! at the end means this is not undefined
/*
or we can do this like we did in our linguaflow project
const apikey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if(!apikey || !apiSecret){
    console.error('Stream api key or secret is missing');
    process.exit(1);
}
*/


export default streamServerClient;