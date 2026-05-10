import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "心本向阳 | AI 学习助手",
  description: "上传课件 PDF，一键生成思维导图、模拟考题、知识卡片和复习大纲。线性代数历年真题，AI 智能组卷。让 AI 帮你高效学习。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
