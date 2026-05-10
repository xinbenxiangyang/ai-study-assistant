import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '管理后台 - AI 学习助手',
  description: '专属管理控制台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
