'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { BarChart3, Zap } from 'lucide-react'

export default function UsagePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(7)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    try {
      const result = await authFetch(`/admin/usage?days=${days}`)
      setData(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchUsage() }, [fetchUsage])

  const maxCalls = data?.daily_breakdown?.length
    ? Math.max(...data.daily_breakdown.map((d: any) => d.calls), 1)
    : 1

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">使用统计</h1>

      <div className="flex items-center gap-2 mb-6">
        {[7, 30, 90].map((n) => (
          <button
            key={n}
            onClick={() => setDays(n)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              days === n
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {n} 天
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">近 {days} 天 API 总调用</p>
                <p className="text-3xl font-bold text-slate-900">{data.total_calls}</p>
              </div>
            </div>

            <div className="space-y-2">
              {data.daily_breakdown?.map((d: any) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${(d.calls / maxCalls) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-8 text-right">{d.calls}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
