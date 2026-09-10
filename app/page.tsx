'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Eye, Filter, FolderKanban, Loader2, MessageCircle, Network, PlayCircle, Search, X } from 'lucide-react'
import ChatPanel from '@/components/ChatPanel'
import CorpusPanel from '@/components/CorpusPanel'
import DemoGuide from '@/components/DemoGuide'
import GraphFilters from '@/components/GraphFilters'
import GraphVisualizer from '@/components/GraphVisualizer'
import Inspector from '@/components/Inspector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GraphDataLoader, type Community, type GraphData } from '@/lib/graphData'
import { ForceSimulation3D, type GraphLayout, type Node3D, defaultForceConfig } from '@/lib/forceSimulation'

const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在加载分析看板…</div>,
})

type WorkspaceView = 'graph' | 'analytics'

function collectCommunityTree(selectedCommunity: Community, allCommunities: Community[]): Community[] {
  const byHumanId = new Map(allCommunities.map(community => [String(community.human_readable_id), community]))
  let root = selectedCommunity
  const visitedParents = new Set<string>()

  while (root.parent !== undefined && !visitedParents.has(root.id)) {
    visitedParents.add(root.id)
    const parent = byHumanId.get(String(root.parent))
    if (!parent) break
    root = parent
  }

  const childrenByParent = new Map<string, Community[]>()
  for (const community of allCommunities) {
    if (community.parent === undefined) continue
    const parentId = String(community.parent)
    childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), community])
  }

  const result: Community[] = []
  const queue = [root]
  const visited = new Set<string>()
  while (queue.length > 0) {
    const community = queue.shift()
    if (!community || visited.has(community.id)) continue
    visited.add(community.id)
    result.push(community)
    const children = childrenByParent.get(String(community.human_readable_id)) ?? []
    for (const child of children) queue.push(child)
  }

  return result.sort((a, b) => a.level - b.level)
}

export default function Home() {
  const [activeView, setActiveView] = useState<WorkspaceView>('graph')
  const [layout, setLayout] = useState<GraphLayout | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('正在初始化…')
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null)
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<string>>(new Set())
  const [minRelationshipWeight, setMinRelationshipWeight] = useState(0)
  const [showCommunityBoundaries, setShowCommunityBoundaries] = useState(true)
  const [inspectorMode, setInspectorMode] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [projectPanelOpen, setProjectPanelOpen] = useState(false)
  const [projectNameRequired, setProjectNameRequired] = useState(false)
  const [currentProjectName, setCurrentProjectName] = useState('')
  const [buildRunning, setBuildRunning] = useState(false)
  const [ragHighlightedNodeIds, setRagHighlightedNodeIds] = useState<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const loadingGraphRef = useRef(false)

  const loadGraph = useCallback(async (mode: 'initial' | 'reload' = 'reload') => {
    if (loadingGraphRef.current) return
    loadingGraphRef.current = true
    if (mode === 'initial') setLoading(true)
    setError(null)

    try {
      setStatus(mode === 'initial' ? '正在检查项目数据…' : '正在刷新知识图谱…')
      if (mode === 'initial') {
        const corpusResponse = await fetch('/api/corpus/state', { cache: 'no-store' })
        if (!corpusResponse.ok) throw new Error('无法读取项目状态')
        const corpus = await corpusResponse.json() as { kgName?: string; outputStats?: Record<string, number> }
        const projectName = String(corpus.kgName ?? '').trim()
        const requiresName = projectName.length === 0
        setCurrentProjectName(projectName)
        setProjectNameRequired(requiresName)
        if (requiresName) setProjectPanelOpen(true)

        const stats = corpus.outputStats ?? {}
        const hasIndex = (stats.entities ?? 0) + (stats.relationships ?? 0) + (stats.communities ?? 0) + (stats.text_units ?? 0) > 0
        if (!hasIndex) {
          setGraphData(null)
          setLayout(null)
          setStatus('请上传文献并构建知识图谱')
          setProjectPanelOpen(true)
          return
        }
      }

      setStatus('正在加载图谱数据…')
      const nextGraph = await new GraphDataLoader('/api/data').loadGraphData()
      setStatus('正在计算三维布局…')
      const startedAt = performance.now()
      const nextLayout = await new ForceSimulation3D(defaultForceConfig).generateLayout(nextGraph)
      const elapsed = Math.round(performance.now() - startedAt)
      setGraphData(nextGraph)
      setLayout(nextLayout)
      setSelectedNode(current => current ? nextLayout.nodes.find(node => node.id === current.id) ?? null : null)
      setStatus(`图谱已加载 · 布局 ${elapsed.toLocaleString()}ms`)
    } catch (cause) {
      console.error('Failed to load graph data', cause)
      setError('加载知识图谱失败。请确认项目已完成索引，然后重试。')
    } finally {
      setLoading(false)
      loadingGraphRef.current = false
    }
  }, [])

  useEffect(() => {
    loadGraph('initial')
  }, [loadGraph])

  useEffect(() => {
    let cancelled = false
    let lastDataVersion: number | null = null
    const poll = async () => {
      try {
        const response = await fetch('/api/corpus/index/status', { cache: 'no-store' })
        if (!response.ok || cancelled) return
        const job = await response.json() as { running?: boolean; dataVersion?: number }
        setBuildRunning(job.running === true)
        const version = job.dataVersion ?? 0
        if (lastDataVersion !== null && version !== lastDataVersion) loadGraph()
        lastDataVersion = version
      } catch {
        if (!cancelled) setBuildRunning(false)
      }
    }
    poll()
    const timer = window.setInterval(poll, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [loadGraph])

  useEffect(() => {
    const refresh = () => loadGraph()
    const clear = () => {
      setGraphData(null)
      setLayout(null)
      setSelectedNode(null)
      setStatus('请上传文献并构建知识图谱')
    }
    window.addEventListener('graph-data-updated', refresh)
    window.addEventListener('graph-data-cleared', clear)
    return () => {
      window.removeEventListener('graph-data-updated', refresh)
      window.removeEventListener('graph-data-cleared', clear)
    }
  }, [loadGraph])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
        setSelectedNode(null)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setActiveView('graph')
        window.requestAnimationFrame(() => searchInputRef.current?.focus())
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const entityTypes = useMemo(() => [...new Set(graphData?.entities.map(entity => entity.type).filter(Boolean) ?? [])].sort(), [graphData])
  const communityLevels = useMemo(() => [...new Set(graphData?.communities.map(community => community.level) ?? [])].sort((a, b) => a - b), [graphData])
  const maxRelationshipWeight = useMemo(() => Math.max(1, ...(graphData?.relationships.map(relationship => relationship.weight) ?? [1])), [graphData])

  const filteredLayout = useMemo(() => {
    if (!layout) return null
    const nodes = layout.nodes.filter(node =>
      (selectedEntityTypes.size === 0 || selectedEntityTypes.has(node.type)) &&
      (selectedLevel === null || node.communityLevel === selectedLevel)
    )
    const nodeIds = new Set(nodes.map(node => node.id))
    const links = layout.links.filter(link =>
      link.weight >= minRelationshipWeight && nodeIds.has(link.source.id) && nodeIds.has(link.target.id)
    )
    return { nodes, links, communities: layout.communities }
  }, [layout, minRelationshipWeight, selectedEntityTypes, selectedLevel])

  const connectedLinks = useMemo(() => {
    if (!selectedNode || !filteredLayout) return []
    return filteredLayout.links.filter(link => link.source.id === selectedNode.id || link.target.id === selectedNode.id)
  }, [filteredLayout, selectedNode])

  const visibleCommunities = useMemo(() => {
    if (!layout) return []
    if (!inspectorMode || !selectedNode?.community) return layout.communities
    return collectCommunityTree(selectedNode.community, layout.communities)
  }, [inspectorMode, layout, selectedNode])

  const selectEntityById = useCallback((entityId: string) => {
    const node = layout?.nodes.find(item => item.id === entityId)
    if (!node) return
    setSelectedNode(node)
    setSearchTerm('')
    setActiveView('graph')
    setChatOpen(false)
  }, [layout])

  const selectEntityType = useCallback((entityType: string) => {
    setSelectedEntityTypes(new Set([entityType]))
    setActiveView('graph')
  }, [])

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background" data-hmi-root>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 border border-white/12 bg-[#05080b]/82 p-1.5 shadow-xl backdrop-blur-xl">
          <div className="hidden min-w-0 px-2 sm:block">
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-primary">SciGraph</div>
            <div className="max-w-40 truncate text-xs font-medium">{currentProjectName || '科研知识工作台'}</div>
          </div>
          <div className="hidden h-7 w-px bg-white/10 sm:block" />
          <NavButton active={activeView === 'graph'} icon={Network} label="知识图谱" onClick={() => setActiveView('graph')} />
          <NavButton active={activeView === 'analytics'} icon={BarChart3} label="数据看板" onClick={() => setActiveView('analytics')} />
        </div>

        <div className="pointer-events-auto flex min-w-0 items-center gap-1.5">
          {activeView === 'graph' && (
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="搜索实体…"
                aria-label="搜索实体"
                className="h-10 w-52 rounded-none border-white/12 bg-[#05080b]/82 pl-8 pr-8 text-xs backdrop-blur-xl"
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="清空搜索"><X className="h-3.5 w-3.5" /></button>}
            </div>
          )}
          {activeView === 'graph' && <ToolbarButton active={filtersOpen} icon={Filter} label="筛选" onClick={() => setFiltersOpen(value => !value)} />}
          <ToolbarButton active={chatOpen} icon={MessageCircle} label="AI 问答" onClick={() => setChatOpen(true)} />
          <ToolbarButton active={guideOpen} icon={PlayCircle} label="演示" onClick={() => setGuideOpen(true)} />
          <ToolbarButton active={buildRunning} icon={buildRunning ? Loader2 : FolderKanban} label="项目" onClick={() => setProjectPanelOpen(true)} spinning={buildRunning} />
        </div>
      </header>

      {activeView === 'graph' ? (
        <div className="absolute inset-0">
          <GraphVisualizer
            layout={filteredLayout}
            loading={loading}
            error={error}
            status={status}
            onRetry={() => loadGraph()}
            selectedEntityTypes={selectedEntityTypes}
            minRelationshipWeight={minRelationshipWeight}
            showCommunityBoundaries={showCommunityBoundaries}
            visibleCommunities={visibleCommunities}
            communityMode={inspectorMode && selectedNode ? 'auto' : 'all'}
            selectedLevel={selectedLevel}
            onNodeSelect={setSelectedNode}
            selectedNode={selectedNode}
            ragHighlightedNodeIds={ragHighlightedNodeIds}
            searchTerm={searchTerm}
            onNodeHover={setHoveredNode}
            hoveredNode={hoveredNode}
            viewportOffset={selectedNode ? 420 : 0}
          />

          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 border border-white/10 bg-[#05080b]/72 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground backdrop-blur-xl">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-destructive' : 'bg-emerald-400'}`} />}
            <span className="max-w-[60vw] truncate">{status}</span>
          </div>

          {filtersOpen && (
            <div className="absolute right-4 top-16 z-30">
              <GraphFilters
                entityTypes={entityTypes}
                selectedEntityTypes={selectedEntityTypes}
                onEntityTypesChange={setSelectedEntityTypes}
                minRelationshipWeight={minRelationshipWeight}
                maxRelationshipWeight={maxRelationshipWeight}
                onMinRelationshipWeightChange={setMinRelationshipWeight}
                communityLevels={communityLevels}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                showCommunityBoundaries={showCommunityBoundaries}
                onShowCommunityBoundariesChange={setShowCommunityBoundaries}
                visibleNodes={filteredLayout?.nodes.length ?? 0}
                totalNodes={layout?.nodes.length ?? 0}
                visibleLinks={filteredLayout?.links.length ?? 0}
                totalLinks={layout?.links.length ?? 0}
              />
            </div>
          )}

          {selectedNode && (
            <div className="graphrag-inspector-enter absolute inset-y-0 left-0 z-30 w-[min(420px,calc(100vw-24px))] border-r border-white/15 bg-[#05080b] pt-16">
              <Inspector
                selectedNode={selectedNode}
                connectedLinks={connectedLinks}
                visibleCommunities={visibleCommunities}
                communityMode={inspectorMode ? 'auto' : 'all'}
                onClose={() => setSelectedNode(null)}
                onNodeSelect={setSelectedNode}
                projectName={currentProjectName}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={inspectorMode}
                onClick={() => setInspectorMode(value => !value)}
                className="absolute bottom-4 right-4 rounded-none border-white/15 bg-black/60 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />{inspectorMode ? '显示全部社区' : '隔离所在社区'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <AnalyticsDashboard
          graphData={graphData}
          selectedEntity={selectedNode}
          onSelectEntity={selectEntityById}
          onSelectEntityType={selectEntityType}
        />
      )}

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="w-[min(560px,calc(100vw-16px))] max-w-none gap-0 border-l-white/12 p-0 sm:max-w-none [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>科研文献 AI 问答</SheetTitle>
            <SheetDescription>使用 GraphRAG 检索当前项目并联动知识图谱。</SheetDescription>
          </SheetHeader>
          <ChatPanel
            entities={graphData?.entities}
            selectedEntity={selectedNode}
            onHighlightNodes={ids => setRagHighlightedNodeIds(new Set(ids))}
            onSelectEntity={selectEntityById}
            onClose={() => setChatOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={projectPanelOpen || projectNameRequired} onOpenChange={open => {
        if (!open && projectNameRequired) return
        setProjectPanelOpen(open)
      }}>
        <SheetContent className="w-[min(760px,calc(100vw-16px))] max-w-none gap-0 p-0 sm:max-w-none">
          <SheetHeader className="sr-only">
            <SheetTitle>项目与文档</SheetTitle>
            <SheetDescription>创建、导入、构建和管理本地 GraphRAG 项目。</SheetDescription>
          </SheetHeader>
          <CorpusPanel
            onProjectNamed={name => {
              setCurrentProjectName(name)
              setProjectNameRequired(false)
            }}
            onProjectDeleted={() => {
              setCurrentProjectName('')
              setProjectNameRequired(true)
              setProjectPanelOpen(true)
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent className="w-[min(520px,calc(100vw-16px))] max-w-none gap-0 border-l-white/12 p-0 sm:max-w-none">
          <SheetHeader className="sr-only">
            <SheetTitle>AI4Science 演示路径</SheetTitle>
            <SheetDescription>按步骤体验文献导入、问答、图谱定位和数据分析。</SheetDescription>
          </SheetHeader>
          <DemoGuide
            projectName={currentProjectName}
            entityCount={graphData?.entities.length ?? 0}
            relationshipCount={graphData?.relationships.length ?? 0}
            onOpenProjects={() => {
              setGuideOpen(false)
              setProjectPanelOpen(true)
            }}
            onOpenChat={() => {
              setGuideOpen(false)
              setChatOpen(true)
            }}
            onOpenGraph={() => {
              setGuideOpen(false)
              setActiveView('graph')
            }}
            onOpenAnalytics={() => {
              setGuideOpen(false)
              setActiveView('analytics')
            }}
          />
        </SheetContent>
      </Sheet>
    </main>
  )
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`flex h-8 items-center gap-2 px-2.5 text-xs transition-colors ${active ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ToolbarButton({ active, icon: Icon, label, onClick, spinning = false }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; spinning?: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} aria-pressed={active} className={`h-10 rounded-none border-white/12 bg-[#05080b]/82 px-3 text-xs backdrop-blur-xl ${active ? 'border-primary/50 text-primary' : ''}`}>
      <Icon className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`} /><span className="hidden md:inline">{label}</span>
    </Button>
  )
}
