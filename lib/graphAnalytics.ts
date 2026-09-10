import type { GraphData } from './graphData'

export interface NamedValue {
  name: string
  value: number
}

export interface SankeyNode {
  name: string
  label: string
  entityId: string
  entityType: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface EntityIntensity {
  entityId: string
  name: string
  degree: number
  frequency: number
}

export interface GraphAnalytics {
  metrics: {
    entities: number
    relationships: number
    communities: number
    entityTypes: number
  }
  entityTypes: NamedValue[]
  communities: Array<NamedValue & { communityId: string }>
  levels: Array<{ level: number; communities: number; entities: number }>
  sankey: {
    nodes: SankeyNode[]
    links: SankeyLink[]
  }
  intensity: EntityIntensity[]
}

export function buildGraphAnalytics(graphData: GraphData): GraphAnalytics {
  const entityById = new Map(graphData.entities.map(entity => [entity.id, entity]))
  const typeCounts = new Map<string, number>()

  for (const entity of graphData.entities) {
    const type = entity.type || '未分类'
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
  }

  const entityTypes = [...typeCounts]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const communities = graphData.communities
    .map(community => ({
      communityId: community.id,
      name: community.title || `社区 ${community.human_readable_id}`,
      value: Math.max(community.size, community.entity_ids.length, 1),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 60)

  const levels = [...new Set(graphData.communities.map(community => community.level))]
    .sort((a, b) => a - b)
    .map(level => {
      const atLevel = graphData.communities.filter(community => community.level === level)
      return {
        level,
        communities: atLevel.length,
        entities: atLevel.reduce((total, community) => total + community.entity_ids.length, 0),
      }
    })

  const topRelationships = [...graphData.relationships]
    .filter(relationship => relationship.source !== relationship.target && entityById.has(relationship.source) && entityById.has(relationship.target))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 80)
  const sankeyEntityIds = new Set(topRelationships.flatMap(relationship => [relationship.source, relationship.target]))
  const sankeyNodes = [...sankeyEntityIds].flatMap(entityId => {
    const entity = entityById.get(entityId)
    return entity ? [{ name: entity.id, label: entity.title, entityId: entity.id, entityType: entity.type }] : []
  })
  const sankeyOrder = new Map([...sankeyEntityIds].sort().map((id, index) => [id, index]))
  const sankeyLinkValues = new Map<string, SankeyLink>()
  for (const relationship of topRelationships) {
    const forward = (sankeyOrder.get(relationship.source) ?? 0) < (sankeyOrder.get(relationship.target) ?? 0)
    const source = forward ? relationship.source : relationship.target
    const target = forward ? relationship.target : relationship.source
    const key = `${source}\u0000${target}`
    const existing = sankeyLinkValues.get(key)
    sankeyLinkValues.set(key, {
      source,
      target,
      value: (existing?.value ?? 0) + Math.max(relationship.weight, 0.1),
    })
  }
  const sankeyLinks = [...sankeyLinkValues.values()]

  const intensity = [...graphData.entities]
    .sort((a, b) => (b.degree + b.frequency) - (a.degree + a.frequency))
    .slice(0, 24)
    .map(entity => ({
      entityId: entity.id,
      name: entity.title,
      degree: entity.degree,
      frequency: entity.frequency,
    }))

  return {
    metrics: {
      entities: graphData.entities.length,
      relationships: graphData.relationships.length,
      communities: graphData.communities.length,
      entityTypes: entityTypes.length,
    },
    entityTypes,
    communities,
    levels,
    sankey: { nodes: sankeyNodes, links: sankeyLinks },
    intensity,
  }
}
