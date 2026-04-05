import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GuAI",
  description:
    "A ChatGPT-like AI chat application with multiple conversation support, powered by advanced language models.",
  keywords: ["AI", "chat", "assistant", "conversations"],
  openGraph: {
    title: "GuAI — Your AI Assistant",
    description: "Chat with AI across multiple conversations, all persisted securely.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
