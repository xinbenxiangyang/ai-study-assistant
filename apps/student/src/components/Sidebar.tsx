'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Upload, History, LogOut, BookOpen, Sigma } from 'lucide-react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const links = [
  { href: '/dashboard', label: '总览', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: '上传课件', icon: Upload },
  { href: '/dashboard/history', label: '历史记录', icon: History },
  { href: '/linear-algebra', label: '线性代数', icon: Sigma },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <BookOpen className="w-6 h-6" />
          AI 学习助手
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
