'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authFetch } from '@/lib/api'
import { ArrowLeft, Printer, ChevronLeft, ChevronRight, Sun, Sparkles, Loader2 } from 'lucide-react'

const YEARS = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025']

export default function ExamDetail() {
  const params = useParams()
  const router = useRouter()
  const year = params.year as string

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<Record<string, string>>({})
  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  const currentIndex = YEARS.indexOf(year)

  useEffect(() => {
    setLoading(true)
    authFetch(`/linear-algebra/exams/${year}`)
      .then(setExam)
      .catch(() => router.push('/linear-algebra'))
      .finally(() => setLoading(false))
  }, [year])

  const analyzeKnowledgePoint = useCallback(async (sectionIndex: number, questionText: string) => {
    setAiLoading(`section-${sectionIndex}`)
    try {
      const data = await authFetch('/linear-algebra/knowledge-points', {
        method: 'POST',
        body: JSON.stringify({ year, section_index: sectionIndex, question_text: questionText }),
      })
      setAiResult(prev => ({ ...prev, [`section-${sectionIndex}`]: data.analysis }))
      setExpandedSection(sectionIndex)
    } catch (e: any) {
      alert('分析失败：' + e.message)
    }
    setAiLoading(null)
  }, [year])

  const handlePrint = () => {
    window.print()
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    if (newIndex >= 0 && newIndex < YEARS.length) {
      router.push(`/linear-algebra/${YEARS[newIndex]}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Print-only header */}
      <div className="hidden print:block print:mb-4 print:pb-4 print:border-b print:border-black">
        <h1 className="text-xl font-bold text-center">中南大学 {year} 学年线性代数（下）期末试题</h1>
        <p className="text-center text-sm mt-1">心本向阳 · 考试专栏</p>
      </div>

      {/* Top bar */}
      <div className="print:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/linear-algebra" className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-slate-700">心本向阳</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateYear('prev')}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium min-w-[80px] text-center">{year}</span>
            <button
              onClick={() => navigateYear('next')}
              disabled={currentIndex >= YEARS.length - 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Printer className="w-4 h-4" /> 打印
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 text-center print:text-xl">
            中南大学 {year} 学年
          </h1>
          <p className="text-center text-slate-500 mb-8 print:mb-4">线性代数（下）期末试题 · 答案版</p>

          {exam?.sections?.map((sec: any, i: number) => (
            <div key={i} className="mb-8 print:mb-4 print:break-inside-avoid">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold text-slate-800">{sec.title}</h3>
                <button
                  className="print:hidden shrink-0 inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                  onClick={() => analyzeKnowledgePoint(i, sec.content)}
                  disabled={aiLoading === `section-${i}`}
                >
                  {aiLoading === `section-${i}` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI 分析知识点
                </button>
              </div>

              {/* Question content */}
              <div className="font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-4 print:bg-white print:p-0 print:text-xs">
                {sec.content}
              </div>

              {/* AI analysis result */}
              {expandedSection === i && aiResult[`section-${i}`] && (
                <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg print:hidden">
                  <p className="text-xs font-medium text-indigo-500 mb-1">AI 知识点分析</p>
                  <div className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                    {aiResult[`section-${i}`]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
