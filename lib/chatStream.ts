export type ChatStreamEvent = {
  event: string
  data: Record<string, unknown>
}
export function parseSseBlock(block: string): ChatStreamEvent | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }

  if (dataLines.length === 0) return null

  try {
    const parsed = JSON.parse(dataLines.join('\n')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return { event, data: parsed as Record<string, unknown> }
  } catch {
    return null
  }
}

export function takeSseBlocks(buffer: string): { blocks: string[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  return {
    blocks: parts.slice(0, -1),
    remainder: parts.at(-1) ?? '',
  }
}

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}
