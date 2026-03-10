import { NextRequest, NextResponse } from "next/server"

// Serve SVG as icon for sizes not available as PNG
export async function GET(
  request: NextRequest,
  { params }: { params: { size: string } }
) {
  // Validate size is a positive integer to prevent SVG/content injection
  const rawSize = params.size
  const sizeNum = parseInt(rawSize, 10)
  if (isNaN(sizeNum) || sizeNum <= 0 || sizeNum > 1024 || String(sizeNum) !== rawSize) {
    return new NextResponse("Invalid size", { status: 400 })
  }
  const safeSize = sizeNum.toString()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="${safeSize}" height="${safeSize}">
  <rect width="192" height="192" rx="40" fill="#4A6FA5"/>
  <path d="M96 140 C96 140 52 110 52 80 C52 65 64 55 78 55 C86 55 92 59 96 64 C100 59 106 55 114 55 C128 55 140 65 140 80 C140 110 96 140 96 140Z" fill="#FAF7F2"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
