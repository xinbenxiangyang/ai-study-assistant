'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

interface Card {
  id: number
  front: string
  back: string
}

export default function FlashcardView({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (!cards || cards.length === 0) {
    return <p className="text-slate-500 text-center py-8">暂无卡片，请重试。</p>
  }

  const card = cards[index]
  const total = cards.length

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-slate-500 mb-4">{index + 1} / {total}</p>

      {/* Card */}
      <div
        className="relative w-full h-64 cursor-pointer perspective"
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`relative w-full h-full card-flip ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="card-front bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 flex items-center justify-center text-white text-center">
            <p className="text-xl font-semibold">{card.front}</p>
          </div>
          {/* Back */}
          <div className="card-back bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 flex items-center justify-center text-white text-center">
            <p className="text-lg">{card.back}</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">点击卡片翻转</p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          disabled={index === 0}
          onClick={() => { setIndex(index - 1); setFlipped(false); }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          onClick={() => setFlipped(false)}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
          disabled={index === total - 1}
          onClick={() => { setIndex(index + 1); setFlipped(false); }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
