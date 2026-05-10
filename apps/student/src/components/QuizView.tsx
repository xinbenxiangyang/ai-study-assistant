'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'

interface MCQ {
  id: number
  question: string
  options: { A: string; B: string; C: string; D: string }
  correct: string
  explanation: string
}

interface SAQ {
  id: number
  question: string
  answer: string
}

export default function QuizView({ quiz }: { quiz: { multiple_choice: MCQ[]; short_answer: SAQ[] } }) {
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({})
  const [revealedMcq, setRevealedMcq] = useState<Record<number, boolean>>({})
  const [revealedSaq, setRevealedSaq] = useState<Record<number, boolean>>({})
  const [saqAnswers, setSaqAnswers] = useState<Record<number, string>>({})

  if (quiz.multiple_choice.length === 0 && quiz.short_answer.length === 0) {
    return <p className="text-slate-500 text-center py-8">暂无题目，请重试。</p>
  }

  return (
    <div className="space-y-8">
      {quiz.multiple_choice.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4">一、选择题</h3>
          <div className="space-y-4">
            {quiz.multiple_choice.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-medium mb-3">{q.id}. {q.question}</p>
                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isSelected = mcqAnswers[q.id] === opt
                    const isCorrect = opt === q.correct
                    const showResult = revealedMcq[q.id]

                    let btnClass = 'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all '
                    if (!showResult) {
                      btnClass += isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } else {
                      if (isCorrect) btnClass += 'border-green-400 bg-green-50 text-green-700'
                      else if (isSelected && !isCorrect) btnClass += 'border-red-400 bg-red-50 text-red-700'
                      else btnClass += 'border-slate-200 text-slate-400'
                    }

                    return (
                      <button
                        key={opt}
                        className={btnClass}
                        onClick={() => !showResult && setMcqAnswers({ ...mcqAnswers, [q.id]: opt })}
                        disabled={showResult}
                      >
                        <span className="font-semibold mr-2">{opt}.</span>
                        {q.options[opt]}
                        {showResult && isCorrect && <Check className="inline w-4 h-4 ml-2" />}
                        {showResult && isSelected && !isCorrect && <X className="inline w-4 h-4 ml-2" />}
                      </button>
                    )
                  })}
                </div>
                {!revealedMcq[q.id] ? (
                  <button
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => setRevealedMcq({ ...revealedMcq, [q.id]: true })}
                  >
                    查看答案
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="text-amber-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {quiz.short_answer.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4">二、简答题</h3>
          <div className="space-y-4">
            {quiz.short_answer.map((q) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="font-medium mb-3">{q.id}. {q.question}</p>
                <textarea
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  rows={3}
                  placeholder="输入你的答案..."
                  value={saqAnswers[q.id] || ''}
                  onChange={(e) => setSaqAnswers({ ...saqAnswers, [q.id]: e.target.value })}
                />
                {!revealedSaq[q.id] ? (
                  <button
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    onClick={() => setRevealedSaq({ ...revealedSaq, [q.id]: true })}
                  >
                    查看参考答案
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                    <p className="font-medium text-indigo-800 mb-1">参考答案：</p>
                    <p className="text-indigo-700 whitespace-pre-wrap">{q.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
