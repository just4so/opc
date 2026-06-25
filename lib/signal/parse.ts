import { PARSE_PROMPT } from './prompt'
import type { SignalIssueData } from './types'

function preprocessHtml(html: string): string {
  // Remove script, style, head blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')

  // Add newlines after block elements
  text = text
    .replace(/<\/(h[1-6]|p|li|td|th|tr|div|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Collapse whitespace but preserve newlines
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()

  return text.slice(0, 12000)
}

export async function parseSignalHtml(html: string): Promise<SignalIssueData> {
  const processedText = preprocessHtml(html)

  const res = await fetch('https://llm.ziy.cc/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.KUNPO_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'DeepSeek-V3.2',
      temperature: 0.1,
      max_tokens: 4000,
      messages: [{ role: 'user', content: PARSE_PROMPT.replace('{TEXT}', processedText) }],
    }),
  })

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status}`)
  }

  const json = await res.json()
  let content: string = json.choices?.[0]?.message?.content ?? ''

  // Strip markdown code block if present
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  return JSON.parse(content) as SignalIssueData
}
