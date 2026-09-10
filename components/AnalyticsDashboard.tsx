'use client'

import { useCallback, useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import { Activity, Boxes, CircleDotDashed, Network, Waypoints } from 'lucide-react'
import EChart, { type ChartSelection } from './EChart'
import type { Entity, GraphData } from '@/lib/graphData'
import { buildGraphAnalytics } from '@/lib/graphAnalytics'

interface AnalyticsDashboardProps {
  graphData: GraphData | null
  selectedEntity: Entity | null
  onSelectEntity: (entityId: string) => void
  onSelectEntityType: (entityType: string) => void
}
const TEXT = '#dce7e4'
const MUTED = '#80908c'
const GRID = 'rgba(255,255,255,0.08)'
const ACCENT = '#ea5c22'
const CYAN = '#62d9d1'

const baseOption: EChartsCoreOption = {
  animationDuration: 450,
  backgroundColor: 'transparent',
  textStyle: { color: TEXT, fontFamily: 'var(--font-geist-sans)' },
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(8, 13, 15, 0.96)',
    borderColor: 'rgba(255,255,255,0.14)',
    textStyle: { color: TEXT },
  },
  toolbox: {
    right: 8,
    feature: { saveAsImage: { backgroundColor: '#070b0d', pixelRatio: 2 } },
    iconStyle: { borderColor: MUTED },
  },
  aria: { enabled: true },
}

export default function AnalyticsDashboard({ graphData, selectedEntity, onSelectEntity, onSelectEntityType }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => graphData ? buildGraphAnalytics(graphData) : null, [graphData])
  const onChartClick = useCallback((selection: ChartSelection) => {
    if (selection.entityId) onSelectEntity(selection.entityId)
    else if (selection.entityType) onSelectEntityType(selection.entityType)
  }, [onSelectEntity, onSelectEntityType])

  const options = useMemo(() => {
    if (!analytics) return null

    const typeBar: EChartsCoreOption = {
      ...baseOption,
      grid: { left: 44, right: 18, top: 22, bottom: 64 },
      xAxis: {
        type: 'category',
        data: analytics.entityTypes.map(item => item.name),
        axisLabel: { color: MUTED, rotate: 28, interval: 0 },
        axisLine: { lineStyle: { color: GRID } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: MUTED },
        splitLine: { lineStyle: { color: GRID } },
      },
      dataZoom: analytics.entityTypes.length > 8 ? [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 4 }] : [],
      series: [{
        type: 'bar',
        data: analytics.entityTypes.map(item => ({ value: item.value, name: item.name, entityType: item.name })),
        itemStyle: { color: ACCENT, borderRadius: [4, 4, 0, 0] },
        large: analytics.entityTypes.length > 100,
      }],
    }

    const treemap: EChartsCoreOption = {
      ...baseOption,
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { color: TEXT, overflow: 'truncate' },
        upperLabel: { show: false },
        itemStyle: { borderColor: '#080d0f', borderWidth: 2, gapWidth: 2 },
        data: analytics.communities.map((community, index) => ({
          name: community.name,
          value: community.value,
          itemStyle: { color: index % 2 === 0 ? '#245d5b' : '#7b3f28' },
        })),
      }],
    }

    const sankey: EChartsCoreOption = {
      ...baseOption,
      series: [{
        type: 'sankey',
        left: 12,
        right: 12,
        top: 24,
        bottom: 12,
        emphasis: { focus: 'adjacency' },
        nodeGap: 9,
        nodeWidth: 10,
        layoutIterations: 24,
        data: analytics.sankey.nodes.map(node => ({
          name: node.name,
          label: { formatter: node.label, color: TEXT, fontSize: 10 },
          entityId: node.entityId,
          entityType: node.entityType,
          itemStyle: { color: selectedEntity?.id === node.entityId ? ACCENT : CYAN },
        })),
        links: analytics.sankey.links,
        lineStyle: { color: 'gradient', opacity: 0.28, curveness: 0.55 },
      }],
    }

    const levels: EChartsCoreOption = {
      ...baseOption,
      legend: { top: 4, textStyle: { color: MUTED } },
      grid: { left: 46, right: 18, top: 46, bottom: 34 },
      xAxis: {
        type: 'category',
        data: analytics.levels.map(item => `L${item.level}`),
        axisLabel: { color: MUTED },
        axisLine: { lineStyle: { color: GRID } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: MUTED },
        splitLine: { lineStyle: { color: GRID } },
      },
      series: [
        { name: '社区数', type: 'line', smooth: true, data: analytics.levels.map(item => item.communities), itemStyle: { color: ACCENT }, areaStyle: { color: 'rgba(234,92,34,0.12)' } },
        { name: '实体归属数', type: 'line', smooth: true, data: analytics.levels.map(item => item.entities), itemStyle: { color: CYAN } },
      ],
    }

    const intensityValues = analytics.intensity.flatMap((entity, x) => [
      { value: [x, 0, entity.degree], entityId: entity.entityId },
      { value: [x, 1, entity.frequency], entityId: entity.entityId },
    ])
    const maxIntensity = Math.max(1, ...intensityValues.map(item => Number(item.value[2])))
    const heatmap: EChartsCoreOption = {
      ...baseOption,
      grid: { left: 72, right: 24, top: 24, bottom: 78 },
      xAxis: {
        type: 'category',
        data: analytics.intensity.map(item => item.name),
        axisLabel: { color: MUTED, rotate: 35, overflow: 'truncate', width: 90 },
        axisLine: { lineStyle: { color: GRID } },
      },
      yAxis: {
        type: 'category',
        data: ['关系数', '出现频次'],
        axisLabel: { color: MUTED },
        axisLine: { lineStyle: { color: GRID } },
      },
      visualMap: {
        min: 0,
        max: maxIntensity,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        textStyle: { color: MUTED },
        inRange: { color: ['#102827', '#2e7771', ACCENT] },
      },
      series: [{ type: 'heatmap', data: intensityValues, progressive: 600, emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } } }],
    }

    return { typeBar, treemap, sankey, levels, heatmap }
  }, [analytics, selectedEntity?.id])

  if (!analytics || !options) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <CircleDotDashed className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">暂无分析数据</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">请先在项目面板上传文献并完成知识图谱构建。</p>
        </div>
      </div>
    )
  }

  const metrics = [
    { label: '实体', value: analytics.metrics.entities, icon: Boxes },
    { label: '关系', value: analytics.metrics.relationships, icon: Waypoints },
    { label: '社区', value: analytics.metrics.communities, icon: Network },
    { label: '实体类型', value: analytics.metrics.entityTypes, icon: Activity },
  ]

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(36,93,91,0.16),transparent_32%),#05080b] px-4 pb-12 pt-24 sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Research intelligence</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">科研知识分析看板</h1>
            <p className="mt-2 text-sm text-muted-foreground">从实体、关系和社区结构中观察知识分布；点击可联动图谱。</p>
          </div>
          {selectedEntity && (
            <button onClick={() => onSelectEntity(selectedEntity.id)} className="border border-primary/40 bg-primary/10 px-3 py-2 text-left text-xs hover:bg-primary/15">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-primary">当前实体</span>
              <span className="mt-1 block max-w-64 truncate font-medium">{selectedEntity.title}</span>
            </button>
          )}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <div key={metric.label} className="border border-white/10 bg-white/[0.025] p-4 backdrop-blur">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">{metric.label}</span>
                <metric.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 font-mono text-2xl text-foreground">{metric.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="实体类型分布" subtitle="点击类型可筛选图谱">
            <EChart option={options.typeBar} ariaLabel="实体类型数量柱状图" onDataClick={onChartClick} />
          </ChartCard>
          <ChartCard title="社区规模" subtitle="按社区包含的实体数计算">
            <EChart option={options.treemap} ariaLabel="社区规模矩形树图" />
          </ChartCard>
          <ChartCard title="高权重关系流" subtitle="展示权重最高的 80 条关系" wide>
            <EChart option={options.sankey} ariaLabel="实体关系桑基图" onDataClick={onChartClick} className="min-h-[420px]" />
          </ChartCard>
          <ChartCard title="社区层级结构" subtitle="对比每个层级的社区数与实体归属数">
            <EChart option={options.levels} ariaLabel="社区层级趋势图" />
          </ChartCard>
          <ChartCard title="核心实体强度" subtitle="点击单元格可在图谱中定位实体">
            <EChart option={options.heatmap} ariaLabel="核心实体关系与频次热力图" onDataClick={onChartClick} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, wide = false, children }: { title: string; subtitle: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className={`border border-white/10 bg-[#090d0f]/88 p-4 ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="mb-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}
