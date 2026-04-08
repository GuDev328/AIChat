import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageImage {
  base64: string;
  mimeType: string;
}

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  images?: IMessageImage[];
  createdAt: Date;
}

export interface IConversation extends Document {
  conversationId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageImageSchema = new Schema<IMessageImage>(
  {
    base64: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    images: { type: [MessageImageSchema], default: undefined },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, default: "New Conversation" },
    messages: { type: [MessageSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Clear mongoose model cache for Next.js hot reloading
if (mongoose.models.Conversation) {
  delete mongoose.models.Conversation;
}

const Conversation: Model<IConversation> =
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
