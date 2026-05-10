'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function processMathInText(text: string): string {
  const parts: string[] = []
  let remaining = text

  // Process display math ($$...$$) first
  while (remaining.length > 0) {
    const displayMatch = remaining.match(/\$\$([\s\S]*?)\$\$/)
    const inlineMatch = remaining.match(/(?<!\\)\$(.+?)(?<!\\)\$/)

    // Find which match comes first
    const dIdx = displayMatch?.index ?? Infinity
    const iIdx = inlineMatch?.index ?? Infinity

    if (dIdx === Infinity && iIdx === Infinity) {
      // No more math: push remaining text
      parts.push(remaining)
      break
    }

    if (dIdx < iIdx) {
      // Display math comes first
      const match = displayMatch!
      if (match.index! > 0) {
        parts.push(remaining.slice(0, match.index))
      }
      try {
        const html = katex.renderToString(match[1].trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
          output: 'html',
        })
        parts.push(html)
      } catch {
        parts.push(`<pre><code>${match[1]}</code></pre>`)
      }
      remaining = remaining.slice(match.index! + match[0].length)
    } else {
      // Inline math comes first
      const match = inlineMatch!
      if (match.index! > 0) {
        parts.push(remaining.slice(0, match.index))
      }
      // Skip if it looks like just a number
      if (/^\d+(\.\d+)?\s*$/.test(match[1])) {
        parts.push(`$${match[1]}$`)
      } else {
        try {
          const html = katex.renderToString(match[1].trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            output: 'html',
          })
          parts.push(html)
        } catch {
          parts.push(`$${match[1]}$`)
        }
      }
      remaining = remaining.slice(match.index! + match[0].length)
    }
  }

  return parts.join('')
}

export default function MathMarkdown({ content }: { content: string }) {
  const processed = useMemo(() => processMathInText(content), [content])

  return (
    <div className="math-content text-sm text-slate-700 leading-relaxed">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }) => <h1 className="text-xl font-bold mt-6 mb-3 text-slate-900" {...props}>{children}</h1>,
          h2: ({ children, ...props }) => <h2 className="text-lg font-bold mt-5 mb-2 text-slate-800" {...props}>{children}</h2>,
          h3: ({ children, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2 text-slate-800" {...props}>{children}</h3>,
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="border-collapse border border-slate-300 w-full text-center text-sm" {...props}>{children}</table>
            </div>
          ),
          th: ({ children, ...props }) => <th className="border border-slate-300 px-3 py-1.5 bg-slate-50 font-semibold" {...props}>{children}</th>,
          td: ({ children, ...props }) => <td className="border border-slate-300 px-3 py-1.5" {...props}>{children}</td>,
          hr: (props) => <hr className="my-4 border-slate-200" {...props} />,
          blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-amber-400 pl-4 my-3 text-slate-600" {...props}>{children}</blockquote>,
          code: ({ children, className, ...props }: any) => {
            const isInline = !className
            if (isInline) return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-rose-600" {...props}>{children}</code>
            return <code className={className} {...props}>{children}</code>
          },
          pre: ({ children, ...props }) => <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-x-auto my-3 text-sm" {...props}>{children}</pre>,
          p: ({ children, ...props }) => <p className="my-2" {...props}>{children}</p>,
          li: ({ children, ...props }) => <li className="ml-4 my-1" {...props}>{children}</li>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
