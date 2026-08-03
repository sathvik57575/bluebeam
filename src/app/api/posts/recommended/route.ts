import { validateRequest } from "@/auth";
import { getRecommendedFeed } from "@/lib/recommendations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const data = await getRecommendedFeed(user.id, cursor, 6);
    return Response.json(data);
  } catch (error) {
    console.error("Unable to load recommended posts:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
