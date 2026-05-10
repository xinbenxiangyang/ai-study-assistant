import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BookOpen, Brain, FileQuestion, Lightbulb, Sparkles, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI 驱动的高效学习工具
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            让复习效率
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">提升 10 倍</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            上传课件 PDF，AI 自动生成思维导图、模拟考题、知识卡片和复习大纲。
            从「不知道怎么复习」到「复习完还想再学」，只需 60 秒。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              免费开始使用 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">四大核心功能</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Brain,
                title: '思维导图',
                desc: '自动提取课件知识结构，生成层级化思维导图，一目了然掌握全局框架。',
                color: 'text-purple-600 bg-purple-50',
              },
              {
                icon: FileQuestion,
                title: '模拟考题',
                desc: '根据内容智能生成选择题和简答题，附带详细解析，考前自测最佳伴侣。',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Lightbulb,
                title: '知识卡片',
                desc: '提炼核心概念生成翻转卡片，利用主动回忆法高效记忆，手机也能看。',
                color: 'text-amber-600 bg-amber-50',
              },
              {
                icon: BookOpen,
                title: '复习大纲',
                desc: '一键生成精简易读的复习笔记，标注重点等级，考试范围一目了然。',
                color: 'text-green-600 bg-green-50',
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className={`p-3 rounded-xl ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">简单定价，按需选择</h2>
          <p className="text-center text-slate-500 mb-16">免费开始，随时升级</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: '免费版',
                price: '¥0',
                desc: '体验核心功能',
                features: ['每天 3 次生成', '单个文件 ≤ 20 页', '思维导图 & 考题', '基础支持'],
                cta: '免费开始',
                href: '/register',
                primary: false,
              },
              {
                name: '学生版',
                price: '¥19',
                period: '/月',
                desc: '适合日常学习',
                features: ['每天 50 次生成', '单个文件 ≤ 100 页', '全部 4 种功能', '历史记录永久保存', '优先处理队列'],
                cta: '立即订阅',
                href: '/register',
                primary: true,
              },
              {
                name: '无限版',
                price: '¥39',
                period: '/月',
                desc: '重度用户首选',
                features: ['无限次数生成', '文件无页数限制', '全部功能 + 优先支持', '历史记录 & 导出', '新功能抢先体验'],
                cta: '立即订阅',
                href: '/register',
                primary: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col ${
                  plan.primary
                    ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-slate-400">{plan.period}</span>}
                </div>
                <Link
                  href={plan.href}
                  className={`w-full py-2.5 rounded-lg text-center font-medium text-sm transition-colors mb-6 ${
                    plan.primary
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-400">
          <p>&copy; 2026 AI 学习助手. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
