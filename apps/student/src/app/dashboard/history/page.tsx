'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/lib/api'
import { History, FileText, Brain, FileQuestion, Lightbulb, BookOpen } from 'lucide-react'

const typeMap: Record<string, { label: string; icon: any; color: string }> = {
  mind_map: { label: '思维导图', icon: Brain, color: 'text-purple-600 bg-purple-50' },
  quiz: { label: '模拟考题', icon: FileQuestion, color: 'text-blue-600 bg-blue-50' },
  flashcards: { label: '知识卡片', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  summary: { label: '复习大纲', icon: BookOpen, color: 'text-green-600 bg-green-50' },
}

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/admin/usage?days=30')
      .then((data) => setRecords(data.daily_breakdown || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">历史记录</h1>
      <p className="text-slate-500 mb-8">查看你的生成历史和使用统计</p>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-2" />
          加载中...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-400" />
            <span className="font-semibold">最近 30 天使用统计</span>
          </div>
          <div className="space-y-2">
            {records.map((r: any) => (
              <div key={r.date} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                <span className="text-sm text-slate-600">{r.date}</span>
                <span className="text-sm font-medium text-indigo-600">{r.calls} 次</span>
              </div>
            ))}
            {records.length === 0 && (
              <p className="text-center text-slate-400 py-8">暂无使用记录，快去上传课件吧！</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
