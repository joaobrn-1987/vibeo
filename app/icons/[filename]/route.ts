import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * Fallback: serve the SVG icon when PNG icons are not available.
 * This handles /icons/icon-192.png and /icons/icon-512.png requests
 * if the actual PNG files haven't been generated yet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const svgPath = join(process.cwd(), "public", "icons", "icon.svg")
    const svg = readFileSync(svgPath, "utf-8")

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
