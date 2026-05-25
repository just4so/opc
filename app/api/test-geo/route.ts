import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (
      key.toLowerCase().includes('geo') ||
      key.toLowerCase().includes('city') ||
      key.toLowerCase().includes('country') ||
      key.toLowerCase().startsWith('eo-') ||
      key.toLowerCase().startsWith('x-real') ||
      key.toLowerCase().startsWith('x-forward')
    ) {
      headers[key] = value
    }
  })
  return NextResponse.json(headers)
}
