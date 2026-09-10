'use client'

import { BarChart3, FileUp, MessageCircle, Network, Quote, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DemoGuideProps {
  projectName: string
  entityCount: number
  relationshipCount: number
  onOpenProjects: () => void
  onOpenChat: () => void
  onOpenGraph: () => void
  onOpenAnalytics: () => void
}
const STEPS = [
  { icon: FileUp, title: '上传科研资料', detail: '在项目面板导入 PDF，并选择 OpenAI 或 Ollama。' },
  { icon: Network, title: '构建知识图谱', detail: '观察索引阶段、实时日志和最终实体/关系数量。' },
  { icon: MessageCircle, title: '提出研究问题', detail: '选择 DRIFT、局部或全局模式，查看检索执行步骤。' },
  { icon: Quote, title: '核对回答证据', detail: '阅读回答中的来源标记和相关实体，确认结论可追溯。' },
  { icon: ScanSearch, title: '定位图谱实体', detail: '从回答跳转到图谱，检查邻居、关系和社区上下文。' },
  { icon: BarChart3, title: '分析知识结构', detail: '使用柱状图、树图、桑基图、趋势图和热力图比较结构。' },
]

export default function DemoGuide({ projectName, entityCount, relationshipCount, onOpenProjects, onOpenChat, onOpenGraph, onOpenAnalytics }: DemoGuideProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#070b0d] px-5 py-6">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Demo journey</div>
      <h2 className="mt-2 text-xl font-semibold">AI4Science 演示路径</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">按下面的顺序展示从文献到证据和知识结构分析的完整闭环。</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="当前项目" value={projectName || '未命名'} />
        <Metric label="实体" value={entityCount.toLocaleString()} />
        <Metric label="关系" value={relationshipCount.toLocaleString()} />
      </div>

      <ol className="mt-6 space-y-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 border border-white/10 bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 font-mono text-[10px] text-primary">{index + 1}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium"><step.icon className="h-3.5 w-3.5 text-muted-foreground" />{step.title}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 border border-primary/20 bg-primary/[0.05] p-4">
        <div className="font-mono text-[9px] uppercase tracking-wider text-primary">推荐问题</div>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
          <li>“这批文献主要研究了哪些问题？”</li>
          <li>“哪些实体之间存在最强的关系？”</li>
          <li>“总结核心发现，并说明对应证据和相关实体。”</li>
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onOpenProjects} className="rounded-none">项目与文档</Button>
        <Button variant="outline" onClick={onOpenChat} className="rounded-none">开始 AI 问答</Button>
        <Button variant="outline" onClick={onOpenGraph} className="rounded-none">探索知识图谱</Button>
        <Button onClick={onOpenAnalytics} className="rounded-none">查看数据看板</Button>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 border border-white/10 p-2.5">
      <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs font-medium" title={String(value)}>{value}</div>
    </div>
  )
}
