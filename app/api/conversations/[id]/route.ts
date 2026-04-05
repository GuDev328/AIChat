import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

// GET /api/conversations/[id] — get messages for a conversation
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const configStr = req.headers.get("x-app-config");
    if (!configStr) throw new Error("No config provided");
    const config = JSON.parse(configStr);
    await connectDB(config.mongoUri);

    const { id } = await context.params;

    const conversation = await Conversation.findOne(
      { conversationId: id },
      { messages: 1, title: 1, conversationId: 1, _id: 0 }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("GET /api/conversations/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] — rename conversation
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const configStr = req.headers.get("x-app-config");
    if (!configStr) throw new Error("No config provided");
    const config = JSON.parse(configStr);
    await connectDB(config.mongoUri);

    const { id } = await context.params;
    const { title } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId: id },
      { title: title.trim() },
      { new: true, select: "conversationId title updatedAt" }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("PATCH /api/conversations/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to rename conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] — delete a conversation
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const configStr = req.headers.get("x-app-config");
    if (!configStr) throw new Error("No config provided");
    const config = JSON.parse(configStr);
    await connectDB(config.mongoUri);

    const { id } = await context.params;

    const result = await Conversation.deleteOne({ conversationId: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/conversations/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
