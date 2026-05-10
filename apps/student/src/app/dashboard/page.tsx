'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, FileQuestion, Lightbulb, BookOpen, Upload, TrendingUp } from 'lucide-react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    // Also try fetching from API
    import('@/lib/api').then(({ authFetch }) => {
      authFetch('/auth/me').then(setUser).catch(() => {})
    })
  }, [])

  const tools = [
    { icon: Brain, label: '思维导图', desc: '梳理知识结构', color: 'bg-purple-500', href: '/dashboard/upload?tool=mind_map' },
    { icon: FileQuestion, label: '模拟考题', desc: '考前自测练习', color: 'bg-blue-500', href: '/dashboard/upload?tool=quiz' },
    { icon: Lightbulb, label: '知识卡片', desc: '高效记忆背诵', color: 'bg-amber-500', href: '/dashboard/upload?tool=flashcards' },
    { icon: BookOpen, label: '复习大纲', desc: '快速掌握重点', color: 'bg-green-500', href: '/dashboard/upload?tool=summary' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          你好，{user?.email?.split('@')[0] || '同学'} 👋
        </h1>
        <p className="text-slate-500 mt-1">今天想学点什么？</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tools.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 ${t.color} rounded-lg flex items-center justify-center mb-3`}>
              <t.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">{t.label}</h3>
            <p className="text-sm text-slate-500 mt-1">{t.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">今日使用</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">0 次</p>
          <p className="text-xs text-slate-400 mt-1">免费版：每天 3 次</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">累计生成</span>
            <Upload className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold">0 次</p>
          <p className="text-xs text-slate-400 mt-1">所有功能总计</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">当前套餐</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold">免费版</p>
          <p className="text-xs text-slate-400 mt-1">
            <Link href="/#pricing" className="text-indigo-600 hover:underline">升级套餐 →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
