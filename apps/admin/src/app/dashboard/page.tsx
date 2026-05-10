'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/api'
import { Users, Zap, Coins, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    authFetch('/admin/stats')
      .then(setStats)
      .catch((e) => {
        setError(e.message)
        if (e.message.includes('Admin') || e.message.includes('401')) {
          router.push('/')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">加载失败</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const cards = [
    { label: '总用户数', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: '今日活跃', value: stats?.active_today || 0, icon: Activity, color: 'bg-green-500' },
    { label: 'API 调用总数', value: stats?.total_api_calls || 0, icon: Zap, color: 'bg-purple-500' },
    { label: '预估成本', value: `¥${stats?.estimated_cost?.toFixed(2) || '0.00'}`, icon: Coins, color: 'bg-amber-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">管理控制台</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{c.label}</span>
              <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center`}>
                <c.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      {stats?.subscriptions && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">套餐分布</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.subscriptions).map(([tier, count]) => (
              <div key={tier} className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-indigo-600">{count as number}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {tier === 'free' ? '免费版' : tier === 'student' ? '学生版' : '无限版'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
