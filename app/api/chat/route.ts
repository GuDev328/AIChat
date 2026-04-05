import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";

const LLM_API_URL = "https://llm.chiasegpu.vn/v1/chat/completions";
const LLM_API_KEY = process.env.LLM_API_KEY as string;
const MODEL = "claude-sonnet-4.6";
const MAX_CONTEXT_MESSAGES = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body as {
      conversationId: string;
      message: string;
    };

    if (!conversationId || !message?.trim()) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Find or create conversation with limited context using $slice
    let conversation = await Conversation.findOne(
      { conversationId },
      { messages: { $slice: -MAX_CONTEXT_MESSAGES }, title: 1 },
    ).lean();

    if (!conversation) {
      const title = message.length > 30 ? message.slice(0, 30) + "…" : message;
      await Conversation.create({
        conversationId,
        title,
        messages: [],
      });
      conversation = { title, messages: [] } as any;
    }

    const contextMessages = (conversation?.messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    // Append the new user message to the context
    contextMessages.push({ role: "user", content: message });

    // 4. Call external LLM API
    const llmResponse = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: contextMessages,
        stream: true,
      }),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error("LLM API error:", errText);
      return NextResponse.json(
        { error: "LLM API request failed", details: errText },
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantContent = "";
    let buffer = "";

    const stream = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "") continue;
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              console.error("Stream parse error for chunk", dataStr);
            }
          }
        }
      },
      async flush() {
        try {
          const userMessage = {
            role: "user" as const,
            content: message,
            createdAt: new Date(),
          };
          const assistantMessage = {
            role: "assistant" as const,
            content: assistantContent || "No response",
            createdAt: new Date(),
          };

          await Conversation.updateOne(
            { conversationId },
            {
              $push: { messages: { $each: [userMessage, assistantMessage] } },
              $set: { updatedAt: new Date() },
            }
          );
        } catch (dbErr) {
          console.error("Fail to save DB post-stream:", dbErr);
        }
      },
    });

    return new Response(llmResponse.body!.pipeThrough(stream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
