import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GuAI - Trợ lý AI Thông Minh",
    template: "%s | GuAI",
  },
  description:
    "Ứng dụng chat AI thông minh với khả năng hỗ trợ nhiều cuộc trò chuyện, được hỗ trợ bởi các mô hình ngôn ngữ tiên tiến.",
  keywords: [
    "AI",
    "chat",
    "trợ lý AI",
    "AI assistant",
    "chatbot",
    "trò chuyện AI",
    "hỗ trợ đa ngôn ngữ",
  ],
  authors: [{ name: "GuAI Team" }],
  creator: "GuAI Team",
  publisher: "GuAI",
  metadataBase: new URL("https://ai.gudev.id.vn"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "GuAI - Trợ lý AI Thông Minh",
    description:
      "Chat với AI qua nhiều cuộc trò chuyện, tất cả đều được lưu trữ an toàn.",
    url: "https://ai.gudev.id.vn",
    siteName: "GuAI",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuAI - Trợ lý AI Thông Minh",
    description:
      "Chat với AI qua nhiều cuộc trò chuyện, tất cả đều được lưu trữ an toàn.",
    creator: "@guai",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={inter.variable + " mdl-js"}
      suppressHydrationWarning
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "GuAI",
              description:
                "Ứng dụng chat AI thông minh với khả năng hỗ trợ nhiều cuộc trò chuyện",
              url: "https://ai.gudev.id.vn",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Organization",
                name: "GuAI Team",
              },
              inLanguage: "vi",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
