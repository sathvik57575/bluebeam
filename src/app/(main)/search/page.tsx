import { Metadata } from "next";
import TrendsSidebar from "@/components/TrendsSidebar";
import SearchResults from "./SearchResults";


//we also need props since we need to access the search query params
interface pageProps{
    searchParams: Promise<{q:string}>
}


//using the generateMetadata() function instead of normal metadata since this is not just static metadata setter, this should be dynamic and we wanna display the search query in the page title, since we can have multiple search queries we need to make this a function, logic bruh, we always can't have a single static searh query everytime since search queries keep changing
export async function generateMetadata({searchParams}: pageProps): Promise<Metadata> {
    const {q} = await searchParams;
    return {
        title: `Search results for ${q}`
    }
}

export default async function Page({searchParams}: pageProps){
    const {q} = await searchParams;
    return (
        <main className="flex w-full min-w-0 gap-5">
            <div className="w-full min-w-0 space-y-5">
                <div className="rounded-2xl bg-card p-5 shadow-sm">
                    <h1 className="text-center text-2xl font-bold">Search results for &quot;{q}&quot;</h1>
                </div>
                <SearchResults query={q} />
            </div>
            <TrendsSidebar/>
        </main>
    )
}