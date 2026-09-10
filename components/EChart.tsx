'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { BarChart, HeatmapChart, LineChart, SankeyChart, TreemapChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  AriaComponent,
  BarChart,
  CanvasRenderer,
  DataZoomComponent,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  SankeyChart,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TreemapChart,
  VisualMapComponent,
])

export interface ChartSelection {
  name: string
  entityId?: string
  entityType?: string
}
interface EChartProps {
  option: EChartsCoreOption
  ariaLabel: string
  className?: string
  onDataClick?: (selection: ChartSelection) => void
}

export default function EChart({ option, ariaLabel, className = '', onDataClick }: EChartProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const chart = echarts.init(root, undefined, { renderer: 'canvas' })
    const handleClick = (params: { name?: string; data?: unknown }) => {
      if (!onDataClick) return
      const data = params.data
      const record = data && typeof data === 'object' && !Array.isArray(data)
        ? data as Record<string, unknown>
        : {}
      onDataClick({
        name: typeof params.name === 'string' ? params.name : '',
        entityId: typeof record.entityId === 'string' ? record.entityId : undefined,
        entityType: typeof record.entityType === 'string' ? record.entityType : undefined,
      })
    }

    chart.on('click', handleClick)
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => chart.resize())
    observer?.observe(root)
    const handleWindowResize = () => chart.resize()
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      observer?.disconnect()
      chart.off('click', handleClick)
      chart.dispose()
    }
  }, [onDataClick])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const chart = echarts.getInstanceByDom(root)
    chart?.setOption(option, { notMerge: true, lazyUpdate: true })
  }, [option])

  return <div ref={rootRef} className={`h-full min-h-72 w-full ${className}`} role="img" aria-label={ariaLabel} />
}
