import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

// GET /api/conversations — list all conversations (id, title, updatedAt)
export async function GET(req: Request) {
  try {
    const configStr = req.headers.get("x-app-config");
    if (!configStr) throw new Error("No config provided");
    const config = JSON.parse(configStr);

    await connectDB(config.mongoUri);

    const conversations = await Conversation.find()
      .select("conversationId title updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("Fetch conversations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
