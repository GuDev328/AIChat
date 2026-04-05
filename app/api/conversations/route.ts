import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

// GET /api/conversations — list all conversations (id, title, updatedAt)
export async function GET() {
  try {
    await connectDB();
    const conversations = await Conversation.find(
      {},
      { conversationId: 1, title: 1, updatedAt: 1, _id: 0 }
    ).sort({ updatedAt: -1 });

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
