'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { Search, MoreHorizontal } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authFetch(`/admin/users?page=${page}&page_size=20&search=${encodeURIComponent(search)}`)
      setUsers(data.users || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await authFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      fetchUsers()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const changeSubscription = async (userId: string, tier: string) => {
    try {
      await authFetch(`/admin/users/${userId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ subscription: tier }),
      })
      fetchUsers()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">用户管理</h1>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索邮箱..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">邮箱</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">套餐</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">今日用量</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">总用量</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">加载中...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">暂无用户</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.subscription}
                        onChange={(e) => changeSubscription(u.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="free">免费版</option>
                        <option value="student">学生版</option>
                        <option value="unlimited">无限版</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.daily_usage}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.total_usage}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(u.id, u.is_active)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.is_active ? '正常' : '禁用'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleStatus(u.id, u.is_active)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        {u.is_active ? '禁用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
