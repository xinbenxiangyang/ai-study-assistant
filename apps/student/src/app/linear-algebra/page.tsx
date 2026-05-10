'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/api'
import { BookOpen, Printer, FileText, ArrowRight, Sun, Sparkles } from 'lucide-react'

export default function LinearAlgebraHome() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/linear-algebra/exams')
      .then(setExams)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-amber-100 text-sm font-medium">心本向阳 · 考试专栏</p>
              <h1 className="text-3xl font-bold">线性代数 · 历年真题</h1>
            </div>
          </div>
          <p className="text-amber-100 max-w-2xl">
            收录中南大学 2020-2025 年线性代数（下）期末考试真题与详细答案。
            支持一键打印、AI 知识点分析、智能组卷。
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              href="/linear-algebra/compose"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold text-sm hover:bg-amber-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> AI 智能组卷
            </Link>
          </div>
        </div>
      </div>

      {/* Year cards */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">选择学年</h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Link
                key={exam.year}
                href={`/linear-algebra/${exam.year}`}
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{exam.year} 学年</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {exam.section_count} 道大题 · {Math.round(exam.char_count / 100) / 10}k 字
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-6 pb-12 text-center">
        <p className="text-sm text-slate-400">
          心本向阳 · 祝你考试顺利 🌻
        </p>
      </div>
    </div>
  )
}
