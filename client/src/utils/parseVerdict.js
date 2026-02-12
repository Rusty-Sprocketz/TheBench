/**
 * Parses a [VERDICT]...[/VERDICT] block from agent output.
 * Returns { rating, scores: [{ label, value }], average, summary } or null.
 */
export default function parseVerdict(text) {
  if (!text) return null

  const match = text.match(/\[VERDICT\]([\s\S]*?)\[\/VERDICT\]/)
  if (!match) return null

  const block = match[1]

  // Extract rating
  const ratingMatch = block.match(/Rating:\s*(.+)/)
  const rating = ratingMatch ? ratingMatch[1].trim() : null

  // Extract all score lines (Label: N/10)
  const scorePattern = /^(?!Rating:|Summary:)([^:]+):\s*(\d+)\s*\/\s*10/gm
  const scores = []
  let scoreMatch
  while ((scoreMatch = scorePattern.exec(block)) !== null) {
    scores.push({ label: scoreMatch[1].trim(), value: parseInt(scoreMatch[2], 10) })
  }

  // Compute average
  const average = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.value, 0) / scores.length) * 10) / 10
    : null

  // Extract summary
  const summaryMatch = block.match(/Summary:\s*([\s\S]*?)$/)
  const summary = summaryMatch ? summaryMatch[1].trim() : null

  if (!rating) return null

  return { rating, scores, average, summary }
}
