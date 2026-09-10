'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Bot, Check, ChevronDown, ChevronUp, CircleStop, Clock3, Loader2, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import type { Entity } from '@/lib/graphData'
import { parseSseBlock, readString, readStringArray, takeSseBlocks } from '@/lib/chatStream'

type QueryMode = 'drift' | 'local' | 'global' | 'basic'
type RunState = 'idle' | 'connecting' | 'streaming' | 'stopping' | 'failed'
type StepState = 'running' | 'done'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  entityIds?: string[]
  citations?: string[]
  failed?: boolean
}

interface ChatPanelProps {
  entities?: Entity[]
  selectedEntity?: Entity | null
  onHighlightNodes?: (ids: string[]) => void
  onSelectEntity?: (id: string) => void
  onClose?: () => void
}

const MODE_OPTIONS: Array<{ value: QueryMode; label: string; description: string }> = [
  { value: 'drift', label: 'DRIFT', description: '综合局部与全局证据' },
  { value: 'local', label: '局部', description: '围绕具体实体检索' },
  { value: 'global', label: '全局', description: '总结整个语料主题' },
  { value: 'basic', label: '基础', description: '快速基础检索' },
]

const STEP_LABELS: Record<string, string> = {
  query: '检索 GraphRAG 知识',
  'extract-highlights': '识别相关实体',
  'build-context': '整理知识上下文',
  'fallback-json': '执行本地回退检索',
  'local-search': '补充局部证据',
  'emit-answer': '生成最终回答',
}

const EXAMPLE_QUESTIONS = [
  '这批文献主要研究了哪些问题？',
  '哪些实体之间存在最强的关系？',
  '请总结核心发现并标出相关实体。',
]

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function extractCitations(text: string): string[] {
  const matches = text.match(/\[(?:data|source|sources|引用|来源)[^\]]*\]/gi) ?? []
  return [...new Set(matches)].slice(0, 12)
}

export default function ChatPanel({ entities = [], selectedEntity, onHighlightNodes, onSelectEntity, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [queryMode, setQueryMode] = useState<QueryMode>('drift')
  const [runState, setRunState] = useState<RunState>('idle')
  const [logs, setLogs] = useState<Array<{ type: string; text: string }>>([])
  const [steps, setSteps] = useState<Record<string, StepState>>({})
  const [showLogs, setShowLogs] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [stickToBottom, setStickToBottom] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const entityById = useMemo(() => new Map(entities.map(entity => [entity.id, entity])), [entities])
  const busy = runState === 'connecting' || runState === 'streaming' || runState === 'stopping'
  const canSend = input.trim().length > 0 && !busy

  useEffect(() => {
    if (!startedAt || !busy) return
    const update = () => setElapsedMs(Date.now() - startedAt)
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [busy, startedAt])

  useEffect(() => {
    if (stickToBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, steps, runState, stickToBottom])

  useEffect(() => () => abortRef.current?.abort(), [])

  const pushLog = useCallback((type: string, text: string) => {
    if (!text) return
    setLogs(current => [...current.slice(-119), { type, text }])
  }, [])

  const send = useCallback(async (question?: string) => {
    const prompt = (question ?? input).trim()
    if (!prompt || busy) return

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    const contextualPrompt = selectedEntity
      ? `${prompt}\n\n当前关注实体：${selectedEntity.title}（ID: ${selectedEntity.id}）`
      : prompt
    const userMessage: Message = { id: createMessageId(), role: 'user', content: prompt }
    const history = [...messages, userMessage]

    setMessages(history)
    setInput('')
    setLogs([])
    setSteps({})
    setRunError(null)
    setElapsedMs(0)
    setStartedAt(Date.now())
    setRunState('connecting')
    onHighlightNodes?.([])

    let assistantId: string | null = null
    let pendingEntityIds: string[] = []

    const updateAssistant = (content: string, replace = false) => {
      setMessages(current => {
        const next = [...current]
        if (!assistantId) {
          assistantId = createMessageId()
          next.push({ id: assistantId, role: 'assistant', content, entityIds: pendingEntityIds })
          return next
        }
        const index = next.findIndex(message => message.id === assistantId)
        if (index === -1) return next
        const value = replace ? content : `${next[index].content}${content}`
        next[index] = {
          ...next[index],
          content: value,
          entityIds: pendingEntityIds,
          citations: extractCitations(value),
        }
        return next
      })
    }

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualPrompt,
          history: history.map(message => ({ role: message.role, content: message.content })),
          method: queryMode,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const detail = await response.text()
        throw new Error(detail || `请求失败（HTTP ${response.status}）`)
      }

      setRunState('streaming')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const parsed = takeSseBlocks(buffer)
        buffer = parsed.remainder

        for (const block of parsed.blocks) {
          const message = parseSseBlock(block)
          if (!message) continue
          const { event, data } = message

          if (event === 'status') pushLog('状态', readString(data.message))
          if (event === 'drift-log') pushLog('检索', readString(data.line))
          if (event === 'warning') pushLog('警告', readString(data.message))
          if (event === 'step-start') {
            const name = readString(data.name)
            if (name) setSteps(current => ({ ...current, [name]: 'running' }))
          }
          if (event === 'step-end') {
            const name = readString(data.name)
            if (name) setSteps(current => ({ ...current, [name]: 'done' }))
          }
          if (event === 'highlights') {
            pendingEntityIds = readStringArray(data.ids)
            onHighlightNodes?.(pendingEntityIds)
            setMessages(current => current.map(item => item.id === assistantId ? { ...item, entityIds: pendingEntityIds } : item))
          }
          if (event === 'answer-chunk') updateAssistant(readString(data.text))
          if (event === 'answer') {
            pendingEntityIds = readStringArray(data.highlights)
            onHighlightNodes?.(pendingEntityIds)
            updateAssistant(readString(data.text, '没有返回可展示的回答。'), true)
          }
          if (event === 'fault' || event === 'error') {
            const messageText = readString(data.message, '问答流程失败，请检查项目索引后重试。')
            const recovery = readString(data.recover)
            setRunError(recovery ? `${messageText} ${recovery}` : messageText)
          }
        }

        if (done) break
      }

      setRunState('idle')
    } catch (error) {
      if (controller.signal.aborted) {
        pushLog('状态', '已停止本次回答。')
        setRunState('idle')
      } else {
        const detail = error instanceof Error ? error.message : String(error)
        setRunError(`科研问答失败：${detail} 请确认知识图谱已构建并重试。`)
        setRunState('failed')
        setMessages(current => [
          ...current,
          { id: createMessageId(), role: 'assistant', content: '本次回答未完成。请检查项目索引或模型配置后重试。', failed: true },
        ])
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setStartedAt(null)
    }
  }, [busy, input, messages, onHighlightNodes, pushLog, queryMode, selectedEntity])

  const stop = () => {
    if (!abortRef.current) return
    setRunState('stopping')
    abortRef.current.abort()
  }

  const clear = () => {
    abortRef.current?.abort()
    setMessages([])
    setSteps({})
    setLogs([])
    setRunError(null)
    setRunState('idle')
    onHighlightNodes?.([])
  }

  const handleViewportScroll = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    setStickToBottom(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop < 48)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#070b0d]">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">Evidence grounded</div>
            <h2 className="mt-1 text-sm font-medium">科研文献问答</h2>
            <p className="mt-1 text-xs text-muted-foreground">GraphRAG 检索、步骤追踪与图谱联动</p>
          </div>
          <Button variant="ghost" size="icon" onClick={clear} className="h-8 w-8 rounded-none" title="清空对话"><RotateCcw className="h-3.5 w-3.5" /></Button>
          {onClose && <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-none" title="关闭问答"><X className="h-4 w-4" /></Button>}
        </div>
      </header>

      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {MODE_OPTIONS.map(mode => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setQueryMode(mode.value)}
              disabled={busy}
              aria-pressed={queryMode === mode.value}
              title={mode.description}
              className={`border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${queryMode === mode.value ? 'border-primary bg-primary/12 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {selectedEntity && (
          <button type="button" onClick={() => onSelectEntity?.(selectedEntity.id)} className="mt-3 flex max-w-full items-center gap-2 border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1.5 text-left text-xs text-cyan-100">
            <span className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">上下文</span>
            <span className="truncate">{selectedEntity.title}</span>
          </button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4" viewportRef={viewportRef} onViewportScroll={handleViewportScroll}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="border border-white/10 bg-white/[0.025] p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-medium">从你的知识图谱开始提问</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">回答会显示检索步骤，并高亮相关实体。</p>
              <div className="mt-4 space-y-2">
                {EXAMPLE_QUESTIONS.map(question => (
                  <button key={question} type="button" onClick={() => send(question)} className="block w-full border border-white/10 px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(message => {
            const relatedEntities = (message.entityIds ?? []).flatMap(id => {
              const entity = entityById.get(id)
              return entity ? [entity] : []
            })
            return (
              <article key={message.id} className={message.role === 'user' ? 'ml-8' : 'mr-2'}>
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{message.role === 'user' ? '你的问题' : 'AI 回答'}</div>
                <div className={`whitespace-pre-wrap border p-3 text-sm leading-6 ${message.role === 'user' ? 'border-primary/20 bg-primary/[0.07]' : message.failed ? 'border-destructive/30 bg-destructive/[0.06]' : 'border-white/10 bg-white/[0.025]'}`}>
                  {message.content}
                </div>
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.citations.map(citation => <span key={citation} className="border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 text-[10px] text-amber-100">{citation}</span>)}
                  </div>
                )}
                {relatedEntities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {relatedEntities.slice(0, 12).map(entity => (
                      <button key={entity.id} type="button" onClick={() => onSelectEntity?.(entity.id)} className="border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-1 text-[10px] text-cyan-100 hover:border-cyan-200/50">
                        {entity.title}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            )
          })}

          {Object.keys(steps).length > 0 && (
            <section className="border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Agent 执行步骤</h3>
                <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><Clock3 className="h-3 w-3" />{(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="mt-3 space-y-2">
                {Object.entries(steps).map(([name, state]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    {state === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{STEP_LABELS[name] ?? name}</span>
                  </div>
                ))}
              </div>
              {logs.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <button type="button" onClick={() => setShowLogs(value => !value)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                    {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}{showLogs ? '隐藏运行日志' : '查看运行日志'}
                  </button>
                  {showLogs && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap border border-white/8 bg-black/30 p-2 font-mono text-[9px] leading-4 text-muted-foreground">{logs.map(log => `[${log.type}] ${log.text}`).join('\n')}</pre>}
                </div>
              )}
            </section>
          )}

          {runError && (
            <div className="flex gap-2 border border-destructive/30 bg-destructive/[0.06] p-3 text-xs leading-5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{runError}</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <footer className="border-t border-white/10 bg-[#070b0d] p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="输入关于当前科研知识图谱的问题…"
            className="max-h-32 min-h-11 resize-none rounded-none border-white/12 bg-black/25 text-sm"
            disabled={busy}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          {busy ? (
            <Button type="button" variant="outline" onClick={stop} className="h-11 shrink-0 rounded-none border-destructive/40 px-3 text-destructive hover:bg-destructive/10"><CircleStop className="h-4 w-4" /><span className="sr-only">停止生成</span></Button>
          ) : (
            <Button type="button" onClick={() => send()} disabled={!canSend} className="h-11 shrink-0 rounded-none px-3"><Send className="h-4 w-4" /><span className="sr-only">发送问题</span></Button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          <span>Enter 发送 · Shift+Enter 换行</span>
          <span>{runState === 'connecting' ? '连接中' : runState === 'streaming' ? '生成中' : runState === 'stopping' ? '停止中' : runState === 'failed' ? '可重试' : '就绪'}</span>
        </div>
      </footer>
    </div>
  )
}
