'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/api'
import { ArrowLeft, Sparkles, Loader2, Printer, Sun, BookOpen, FileText, CheckCircle } from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'

const YEARS = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025']

export default function ComposePaper() {
  const [selectedYears, setSelectedYears] = useState<string[]>([...YEARS])
  const [aiCount, setAiCount] = useState(3)
  const [difficulty, setDifficulty] = useState('medium')
  const [paper, setPaper] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'questions' | 'answers' | 'all'>('all')

  const { questions, answers } = useMemo(() => {
    if (!paper) return { questions: '', answers: '' }
    // Split by answer section header
    const patterns = ['\n# 答案', '\n## 答案', '\n===', '\n# 参考答案']
    for (const pat of patterns) {
      const idx = paper.indexOf(pat)
      if (idx > 0) {
        return {
          questions: paper.slice(0, idx).trim(),
          answers: paper.slice(idx + 1).trim(),
        }
      }
    }
    return { questions: paper, answers: '' }
  }, [paper])

  const toggleYear = (y: string) => {
    setSelectedYears(prev =>
      prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y].sort()
    )
  }

  const handleCompose = async () => {
    setLoading(true)
    try {
      const data = await authFetch('/linear-algebra/compose-paper', {
        method: 'POST',
        body: JSON.stringify({ years: selectedYears, ai_count: aiCount, difficulty }),
      })
      setPaper(data.paper)
      setTab('all')
    } catch (e: any) {
      alert('组卷失败：' + e.message)
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="print:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">
          <Link href="/linear-algebra" className="flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
          <span className="text-slate-300">|</span>
          <Sun className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-slate-700">心本向阳 · AI 智能组卷</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Print header */}
        <div className="hidden print:block print:mb-4">
          <h1 className="text-xl font-bold text-center">中南大学线性代数（下）模拟试卷</h1>
          <p className="text-center text-sm mt-1">心本向阳 · AI 智能组卷</p>
        </div>

        {/* Settings panel */}
        {!paper && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 print:hidden">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">AI 智能组卷</h1>
            <p className="text-slate-500 mb-8">选择真题来源，AI 生成一套包含真题和原创题的完整试卷</p>

            {/* Year selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">选择真题年份</label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedYears.includes(y)
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* AI count */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                AI 原创题数量：<span className="text-orange-600 font-bold">{aiCount} 道</span>
              </label>
              <input type="range" min={0} max={8} value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-slate-400"><span>0</span><span>8</span></div>
            </div>

            {/* Difficulty */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">试卷难度</label>
              <div className="flex gap-2">
                {[
                  { key: 'easy', label: '基础' },
                  { key: 'medium', label: '中等' },
                  { key: 'hard', label: '困难' },
                ].map(d => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      difficulty === d.key ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompose}
              disabled={loading || selectedYears.length === 0}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> AI 正在组卷...</> : <><Sparkles className="w-5 h-5" /> 开始组卷</>}
            </button>
          </div>
        )}

        {/* Generated paper with tabs */}
        {paper && (
          <div>
            {/* Controls bar */}
            <div className="print:hidden flex items-center justify-between mb-6 flex-wrap gap-3">
              <button onClick={() => setPaper('')} className="text-sm text-slate-500 hover:text-orange-600">
                ← 重新设置
              </button>

              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { key: 'all' as const, label: '全部', icon: FileText },
                  { key: 'questions' as const, label: '试题', icon: FileText },
                  { key: 'answers' as const, label: '答案', icon: CheckCircle },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                <Printer className="w-4 h-4" /> 打印{tab === 'questions' ? '试题' : tab === 'answers' ? '答案' : ''}
              </button>
            </div>

            {/* Content area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10">
              {/* All tab */}
              {(tab === 'all') && (
                <div>
                  <div id="print-questions">
                    <MathMarkdown content={questions} />
                  </div>
                  {answers && (
                    <>
                      <hr className="my-8 border-slate-300 print:my-4" />
                      <div id="print-answers">
                        <MathMarkdown content={answers} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Questions only */}
              {tab === 'questions' && (
                <div id="print-questions">
                  <MathMarkdown content={questions} />
                </div>
              )}

              {/* Answers only */}
              {tab === 'answers' && (
                <div id="print-answers">
                  <MathMarkdown content={answers} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info card */}
        {!paper && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 print:hidden">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">组卷说明</p>
                <p className="text-sm text-amber-700 mt-1">
                  AI 会参考所选年份的真题风格（题型分布、难度、考察范围），
                  融合历年典型题和 AI 原创题，生成一套结构完整的期末模拟试卷。
                  生成后可按「试题」和「答案」分开查看和打印。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
