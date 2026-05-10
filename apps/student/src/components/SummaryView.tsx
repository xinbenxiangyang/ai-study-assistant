'use client'

import ReactMarkdown from 'react-markdown'

export default function SummaryView({ content }: { content: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 markdown">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
