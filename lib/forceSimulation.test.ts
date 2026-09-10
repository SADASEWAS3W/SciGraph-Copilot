import { describe, expect, it } from 'vitest'
import type { GraphData } from './graphData'
import { ForceSimulation3D, defaultForceConfig } from './forceSimulation'

function createLargeGraph(size: number): GraphData {
  return {
    entities: Array.from({ length: size }, (_, index) => ({
      id: `entity-${index}`,
      human_readable_id: String(index),
      title: `Entity ${index}`,
      type: index % 2 === 0 ? 'PAPER' : 'TARGET',
      description: '',
      text_unit_ids: [],
      frequency: index % 11,
      degree: index % 17,
    })),
    relationships: Array.from({ length: size - 1 }, (_, index) => ({
      id: `relationship-${index}`,
      human_readable_id: String(index),
      source: `entity-${index}`,
      target: `entity-${index + 1}`,
      description: 'related',
      weight: 1 + (index % 5),
      combined_degree: 2,
      text_unit_ids: [],
    })),
    communities: [{
      id: 'community-0',
      human_readable_id: '0',
      community: '0',
      level: 0,
      children: [],
      title: 'Large graph',
      entity_ids: Array.from({ length: size }, (_, index) => `entity-${index}`),
      relationship_ids: [],
      text_unit_ids: [],
      period: '',
      size,
    }],
    communityReports: [],
  }
}

describe('large graph layout degradation', () => {
  it('prepares a 6k graph without entering the iterative main-thread simulation', async () => {
    const graph = createLargeGraph(6000)
    const startedAt = performance.now()
    const layout = await new ForceSimulation3D(defaultForceConfig).generateLayout(graph)
    const elapsedMs = performance.now() - startedAt

    expect(layout.nodes).toHaveLength(6000)
    expect(layout.links).toHaveLength(5999)
    expect(layout.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y) && Number.isFinite(node.z))).toBe(true)
    expect(elapsedMs).toBeLessThan(5000)
  }, 10000)
})
