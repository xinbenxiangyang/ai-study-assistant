'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { uploadPdf, authFetch } from '@/lib/api'
import MindMapView from '@/components/MindMapView'
import QuizView from '@/components/QuizView'
import FlashcardView from '@/components/FlashcardView'
import SummaryView from '@/components/SummaryView'
import { Upload, Loader2, FileText, Download } from 'lucide-react'

const TOOLS = [
  { key: 'mind_map', label: '思维导图', icon: '🧠' },
  { key: 'quiz', label: '模拟考题', icon: '📝' },
  { key: 'flashcards', label: '知识卡片', icon: '🃏' },
  { key: 'summary', label: '复习大纲', icon: '📋' },
]

function UploadPageInner() {
  const searchParams = useSearchParams()
  const initialTool = searchParams.get('tool') || ''

  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const data = await uploadPdf(file)
      setText(data.text)
      setCharCount(data.char_count)
    } catch (e: any) {
      setError(e.message || '上传失败')
    }
    setUploading(false)
  }, [file])

  const handleGenerate = useCallback(async (type: string) => {
    if (!text) return
    setGenerating(true)
    setError('')
    try {
      const data = await authFetch('/ai/' + ({
        mind_map: 'mind-map', quiz: 'quiz', flashcards: 'flashcards', summary: 'summary'
      }[type] || type), {
        method: 'POST',
        body: JSON.stringify({ text, type }),
      })

      if (type === 'quiz') setResult({ type: 'quiz', data: data.quiz })
      else if (type === 'flashcards') setResult({ type: 'flashcards', data: data.flashcards?.cards || [] })
      else setResult({ type, data: data.content })
    } catch (e: any) {
      setError(e.message || '生成失败')
    }
    setGenerating(false)
  }, [text])

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">上传课件</h1>
      <p className="text-slate-500 mb-8">上传 PDF 课件，选择你需要的 AI 功能</p>

      {/* Upload area */}
      {!text && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center hover:border-indigo-400 transition-colors">
          <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">拖拽或点击上传 PDF 课件</p>
          <p className="text-sm text-slate-400 mb-4">支持中文 PDF，建议不超过 50 页</p>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            id="pdf-upload"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="pdf-upload"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            选择文件
          </label>
          {file && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4" />
              {file.name}
              <button
                className="ml-4 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? '解析中...' : '开始解析'}
              </button>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          正在解析 PDF...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mt-4">{error}</div>
      )}

      {/* Text extracted — choose tool */}
      {text && !result && (
        <div>
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4" />
              已提取 {charCount} 字
            </div>
            <button
              className="text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => { setText(''); setFile(null); }}
            >
              重新上传
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOLS.map((t) => (
              <button
                key={t.key}
                className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all disabled:opacity-50"
                onClick={() => handleGenerate(t.key)}
                disabled={generating}
              >
                <span className="text-2xl">{t.icon}</span>
                <h3 className="font-semibold mt-2">{t.label}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.key === 'mind_map' && '结构化知识图谱'}
                  {t.key === 'quiz' && '选择 + 简答题'}
                  {t.key === 'flashcards' && '翻转记忆卡片'}
                  {t.key === 'summary' && '精简易读大纲'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          AI 正在生成中，请稍候...
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              className="text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => setResult(null)}
            >
              ← 选择其他功能
            </button>
            {result.type === 'mind_map' && (
              <a
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(result.data)}`}
                download="思维导图.md"
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                <Download className="w-4 h-4" /> 下载
              </a>
            )}
          </div>

          {result.type === 'mind_map' && <MindMapView content={result.data} />}
          {result.type === 'quiz' && <QuizView quiz={result.data} />}
          {result.type === 'flashcards' && <FlashcardView cards={result.data} />}
          {result.type === 'summary' && <SummaryView content={result.data} />}
        </div>
      )}
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-slate-400">加载中...</div>}>
      <UploadPageInner />
    </Suspense>
  )
}
