import { describe, expect, it } from 'vitest'
import type { GraphData } from './graphData'
import { buildGraphAnalytics } from './graphAnalytics'

const graphData: GraphData = {
  entities: [
    { id: 'a', human_readable_id: '1', title: 'Alpha', type: 'PAPER', description: '', text_unit_ids: [], frequency: 5, degree: 2 },
    { id: 'b', human_readable_id: '2', title: 'Beta', type: 'PAPER', description: '', text_unit_ids: [], frequency: 1, degree: 4 },
    { id: 'c', human_readable_id: '3', title: 'Gamma', type: 'TARGET', description: '', text_unit_ids: [], frequency: 2, degree: 1 },
  ],
  relationships: [
    { id: 'r1', human_readable_id: '1', source: 'a', target: 'b', description: '', weight: 8, combined_degree: 6, text_unit_ids: [] },
    { id: 'r2', human_readable_id: '2', source: 'a', target: 'missing', description: '', weight: 20, combined_degree: 2, text_unit_ids: [] },
  ],
  communities: [
    { id: 'community-1', human_readable_id: '1', community: '1', level: 0, children: [], title: 'Core', entity_ids: ['a', 'b'], relationship_ids: ['r1'], text_unit_ids: [], period: '', size: 2 },
    { id: 'community-2', human_readable_id: '2', community: '2', level: 1, parent: '1', children: [], title: 'Target', entity_ids: ['c'], relationship_ids: [], text_unit_ids: [], period: '', size: 1 },
  ],
  communityReports: [],
}

describe('graph analytics adapter', () => {
  it('builds stable aggregate metrics and entity type counts', () => {
    const result = buildGraphAnalytics(graphData)
    expect(result.metrics).toEqual({ entities: 3, relationships: 2, communities: 2, entityTypes: 2 })
    expect(result.entityTypes).toEqual([
      { name: 'PAPER', value: 2 },
      { name: 'TARGET', value: 1 },
    ])
  })

  it('excludes relationships with missing endpoints from the Sankey graph', () => {
    const result = buildGraphAnalytics(graphData)
    expect(result.sankey.links).toEqual([{ source: 'a', target: 'b', value: 8 }])
    expect(result.sankey.nodes.map(node => node.entityId)).toEqual(['a', 'b'])
  })

  it('summarizes community levels and ranks entity intensity', () => {
    const result = buildGraphAnalytics(graphData)
    expect(result.levels).toEqual([
      { level: 0, communities: 1, entities: 2 },
      { level: 1, communities: 1, entities: 1 },
    ])
    expect(result.intensity[0].entityId).toBe('a')
  })
})
