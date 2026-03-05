import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI诸棋混战",
  description: "五子棋与中国象棋双 LLM 对战平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
