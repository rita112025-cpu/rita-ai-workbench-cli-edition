import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rita AI Workbench — CLI Edition",
  description: "A CLI-first portfolio/workbench navigator for Rita's AI tools, workflows and experiments. Terminal interface over the real rita-ai-workbench manifest.",
  keywords: ["Rita AI Workbench", "CLI", "terminal", "portfolio", "Codex", "Claude Code", "Prompt", "automation"],
  authors: [{ name: "rita112025-cpu" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Rita AI Workbench — CLI Edition",
    description: "CLI-first portfolio/workbench navigator over the real rita-ai-workbench manifest.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rita AI Workbench — CLI Edition",
    description: "CLI-first portfolio/workbench navigator.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
