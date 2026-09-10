import { describe, expect, it } from 'vitest'
import { parseSseBlock, readStringArray, takeSseBlocks } from './chatStream'

describe('chat stream parser', () => {
  it('parses CRLF SSE events with JSON data', () => {
    expect(parseSseBlock('event: highlights\r\ndata: {"ids":["entity-1","entity-2"]}')).toEqual({
      event: 'highlights',
      data: { ids: ['entity-1', 'entity-2'] },
    })
  })

  it('keeps an incomplete event in the remainder', () => {
    expect(takeSseBlocks('event: status\ndata: {"message":"ready"}\n\nevent: answer')).toEqual({
      blocks: ['event: status\ndata: {"message":"ready"}'],
      remainder: 'event: answer',
    })
  })

  it('rejects malformed event data and non-string identifiers', () => {
    expect(parseSseBlock('event: answer\ndata: not-json')).toBeNull()
    expect(readStringArray(['entity-1', 2, null, 'entity-2'])).toEqual(['entity-1', 'entity-2'])
  })
})
