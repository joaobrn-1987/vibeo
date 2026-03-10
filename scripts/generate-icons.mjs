/**
 * Generates icon-192.png and icon-512.png from icon.svg
 * Run: node scripts/generate-icons.mjs
 *
 * Tries ImageMagick first, then Inkscape, then prints instructions.
 */

import { execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const svgPath = resolve(root, "public/icons/icon.svg")
const sizes = [192, 512]

mkdirSync(resolve(root, "public/icons"), { recursive: true })

for (const size of sizes) {
  const outPath = resolve(root, `public/icons/icon-${size}.png`)

  // Try ImageMagick convert
  try {
    execSync(`convert -background "#4A6FA5" "${svgPath}" -resize ${size}x${size} "${outPath}"`, { stdio: "pipe" })
    console.log(`Generated ${outPath} via ImageMagick`)
    continue
  } catch {}

  // Try Inkscape
  try {
    execSync(`inkscape --export-type=png --export-width=${size} --export-height=${size} --export-filename="${outPath}" "${svgPath}"`, { stdio: "pipe" })
    console.log(`Generated ${outPath} via Inkscape`)
    continue
  } catch {}

  // Try rsvg-convert
  try {
    execSync(`rsvg-convert -w ${size} -h ${size} -o "${outPath}" "${svgPath}"`, { stdio: "pipe" })
    console.log(`Generated ${outPath} via rsvg-convert`)
    continue
  } catch {}

  console.warn(`Could not generate icon-${size}.png. Install ImageMagick: sudo apt-get install imagemagick`)
}
