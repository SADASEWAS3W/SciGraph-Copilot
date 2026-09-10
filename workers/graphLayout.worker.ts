/// <reference lib="webworker" />

interface LayoutWorkerEntity {
  id: string
  degree: number
  frequency: number
  communityLevel: number
}

interface LayoutWorkerRequest {
  entities: LayoutWorkerEntity[]
  spread3D: number
  levelSpacing: number
}

function stableJitter(id: string): number {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return 0.92 + ((hash >>> 0) % 1600) / 10000
}

self.onmessage = (event: MessageEvent<LayoutWorkerRequest>) => {
  const { entities, spread3D, levelSpacing } = event.data
  const scores = entities.map(entity => entity.degree + entity.frequency * 0.5)
  const minScore = scores.length > 0 ? Math.min(...scores) : 0
  const maxScore = scores.length > 0 ? Math.max(...scores) : 1
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const total = Math.max(entities.length, 1)

  const output = entities.map((entity, index) => {
    const score = scores[index]
    const normalized = maxScore > minScore ? (score - minScore) / (maxScore - minScore) : 0.5
    const radius = spread3D * 0.1 + (1 - normalized) * spread3D * 0.9
    const adjustedRadius = (radius + entity.communityLevel * levelSpacing * 0.3) * stableJitter(entity.id)
    const phi = Math.acos(1 - 2 * ((index + 0.5) / total))
    const theta = goldenAngle * index
    return {
      id: entity.id,
      x: adjustedRadius * Math.sin(phi) * Math.cos(theta),
      y: adjustedRadius * Math.sin(phi) * Math.sin(theta),
      z: adjustedRadius * Math.cos(phi),
    }
  })

  self.postMessage(output)
}

export {}
