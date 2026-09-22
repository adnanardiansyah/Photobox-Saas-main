import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const models = [
  'tenant',
  'outlet',
  'outletConfig',
  'user',
  'frameTemplate',
  'sessionPhoto',
  'voucher',
  'transaction',
  'boothHeartbeat',
  'galleryQueue',
  'testimonial',
  'brandAsset',
  'apiKey',
] as const

async function main() {
  const outDir = path.join(__dirname, '.')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const all: Record<string, unknown> = {}

  for (const model of models) {
    // @ts-expect-error dynamic model access
    const rows = await prisma[model].findMany({ orderBy: { createdAt: 'asc' } })
    all[model] = rows
    console.log(`${model}: ${rows.length} rows`)
  }

  const jsonPath = path.join(outDir, `supabase_export_${stamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(all, null, 2), 'utf-8')
  console.log('JSON export ->', jsonPath)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())