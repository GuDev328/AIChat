/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { NextRequest, NextResponse } from "next/server";

interface ChatImage {
  base64: string;
  mimeType: string;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildUserContent(
  message: string,
  images?: ChatImage[],
): string | ContentPart[] {
  if (!images || images.length === 0) {
    return message;
  }

  const parts: ContentPart[] = [];

  // Add images first so the model "sees" them before the text
  for (const img of images) {
    parts.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
      },
    });
  }

  if (message) {
    parts.push({ type: "text", text: message });
  }

  return parts;
}

export async function POST(req: NextRequest) {
  try {
    const configStr = req.headers.get("x-app-config");
    if (!configStr) throw new Error("No config provided");
    const config = JSON.parse(configStr);
    console.log(config);

    const body = await req.json();
    const { conversationId, message, images } = body as {
      conversationId: string;
      message: string;
      images?: ChatImage[];
    };

    if (
      !conversationId ||
      (!message?.trim() && (!images || images.length === 0))
    ) {
      return NextResponse.json(
        { error: "conversationId and message/images are required" },
        { status: 400 },
      );
    }

    await connectDB(config.mongoUri);

    const maxContextMsg = parseInt(config.maxContext) || 30;

    // 1. Find or create conversation with limited context using $slice
    let conversation = await Conversation.findOne(
      { conversationId },
      { messages: { $slice: -maxContextMsg }, title: 1 },
    ).lean();

    if (!conversation) {
      const titleSource = message || "Image conversation";
      const title =
        titleSource.length > 30 ? titleSource.slice(0, 30) + "…" : titleSource;
      await Conversation.create({
        conversationId,
        title,
        messages: [],
      });
      conversation = { title, messages: [] } as any;
    }

    // Build context messages - for previous messages, use simple content format
    const contextMessages = (conversation?.messages || []).map((m: any) => {
      // If previous message has images stored, rebuild multimodal content
      if (m.images && m.images.length > 0) {
        return {
          role: m.role,
          content: buildUserContent(m.content, m.images),
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    // Append the new user message with multimodal content if images exist
    const userContent = buildUserContent(message || "", images);
    contextMessages.push({ role: "user", content: userContent });

    // Check if the entire conversation has any images in DB
    const hasImagesInDB = await Conversation.exists({
      conversationId,
      "messages.images": { $exists: true, $not: { $size: 0 } },
    });

    const hasImagesNow = images && images.length > 0;
    const isUseVisionModel =
      hasImagesNow || (hasImagesInDB && !config.combineModels);

    const useModel = isUseVisionModel ? config.visionModel : config.model;

    // 4. Call external LLM API
    const llmResponse = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: useModel,
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
          const userMessage: any = {
            role: "user" as const,
            content: message || "",
            createdAt: new Date(),
          };

          // Store images in DB if present
          if (images && images.length > 0) {
            userMessage.images = images.map((img) => ({
              base64: img.base64,
              mimeType: img.mimeType,
            }));
          }

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
            },
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
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
