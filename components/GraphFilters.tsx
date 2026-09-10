'use client'

import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GraphFiltersProps {
  entityTypes: string[]
  selectedEntityTypes: Set<string>
  onEntityTypesChange: (types: Set<string>) => void
  minRelationshipWeight: number
  maxRelationshipWeight: number
  onMinRelationshipWeightChange: (weight: number) => void
  communityLevels: number[]
  selectedLevel: number | null
  onLevelChange: (level: number | null) => void
  showCommunityBoundaries: boolean
  onShowCommunityBoundariesChange: (show: boolean) => void
  visibleNodes: number
  totalNodes: number
  visibleLinks: number
  totalLinks: number
}

export default function GraphFilters({
  entityTypes,
  selectedEntityTypes,
  onEntityTypesChange,
  minRelationshipWeight,
  maxRelationshipWeight,
  onMinRelationshipWeightChange,
  communityLevels,
  selectedLevel,
  onLevelChange,
  showCommunityBoundaries,
  onShowCommunityBoundariesChange,
  visibleNodes,
  totalNodes,
  visibleLinks,
  totalLinks,
}: GraphFiltersProps) {
  const reset = () => {
    onEntityTypesChange(new Set())
    onMinRelationshipWeightChange(0)
    onLevelChange(null)
    onShowCommunityBoundariesChange(true)
  }

  return (
    <div className="w-[min(360px,calc(100vw-32px))] border border-white/12 bg-[#070b0d]/96 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4 text-primary" />图谱筛选</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{visibleNodes}/{totalNodes} 实体 · {visibleLinks}/{totalLinks} 关系</div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 rounded-none px-2 text-xs"><RotateCcw className="h-3.5 w-3.5" />重置</Button>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs text-muted-foreground">实体类型</legend>
        <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {entityTypes.map(type => (
            <label key={type} className="flex min-w-0 items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selectedEntityTypes.size === 0 || selectedEntityTypes.has(type)}
                onChange={event => {
                  const next = selectedEntityTypes.size === 0 ? new Set(entityTypes) : new Set(selectedEntityTypes)
                  if (event.target.checked) next.add(type)
                  else next.delete(type)
                  onEntityTypesChange(next.size === entityTypes.length ? new Set() : next)
                }}
                className="accent-[var(--primary)]"
              />
              <span className="truncate" title={type}>{type}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block text-xs text-muted-foreground">
        最小关系权重 <span className="float-right font-mono text-foreground">{minRelationshipWeight}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.ceil(maxRelationshipWeight))}
          step={1}
          value={minRelationshipWeight}
          onChange={event => onMinRelationshipWeightChange(Number(event.target.value))}
          className="mt-2 w-full accent-[var(--primary)]"
        />
      </label>

      <label className="mt-4 block text-xs text-muted-foreground">
        社区层级
        <select value={selectedLevel ?? ''} onChange={event => onLevelChange(event.target.value === '' ? null : Number(event.target.value))} className="mt-2 h-9 w-full border border-white/12 bg-black/30 px-2 text-xs text-foreground">
          <option value="">全部层级</option>
          {communityLevels.map(level => <option key={level} value={level}>L{level}</option>)}
        </select>
      </label>

      <label className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        显示社区边界
        <input type="checkbox" checked={showCommunityBoundaries} onChange={event => onShowCommunityBoundariesChange(event.target.checked)} className="accent-[var(--primary)]" />
      </label>
    </div>
  )
}
