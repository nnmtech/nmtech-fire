import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    remotionApiUrl: process.env.NEXT_PUBLIC_REMOTION_API_URL || 'http://localhost:3001',
    hasEnvVar: !!process.env.NEXT_PUBLIC_REMOTION_API_URL
  })
}
