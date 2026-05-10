'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, Menu, X } from 'lucide-react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">心</span>
            </div>
            <span className="font-bold text-lg text-slate-800 group-hover:text-orange-500 transition-colors">
              心本向阳
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/linear-algebra" className="text-sm text-slate-600 hover:text-orange-600 font-medium transition-colors">线性代数</Link>
            <Link href="/#features" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">功能</Link>
            <Link href="/#pricing" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">定价</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-indigo-600 font-medium">控制台</Link>
                <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700">退出</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-600 hover:text-indigo-600">登录</Link>
                <Link href="/register" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">免费注册</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/#features" className="block py-2 text-slate-600" onClick={() => setOpen(false)}>功能</Link>
            <Link href="/#pricing" className="block py-2 text-slate-600" onClick={() => setOpen(false)}>定价</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 text-indigo-600 font-medium" onClick={() => setOpen(false)}>控制台</Link>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="block py-2 text-slate-500">退出</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-slate-600" onClick={() => setOpen(false)}>登录</Link>
                <Link href="/register" className="block py-2 text-indigo-600 font-medium" onClick={() => setOpen(false)}>免费注册</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
