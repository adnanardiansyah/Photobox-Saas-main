import * as fs from 'fs'
import * as path from 'path'

function esc(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  const s = JSON.stringify(v)
  return "'" + s.replace(/'/g, "''") + "'"
}

function toSql(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  // Date handling
  if (value instanceof Date) return "'" + value.toISOString() + "'"
  // JSON data (photos, operatingHours, etc.)
  const s = JSON.stringify(value)
  return "'" + s.replace(/'/g, "''") + "'"
}

function colName(k: string): string {
  // Prisma field name -> snake_case-ish. Keep as-is in quotes.
  return '"' + k + '"'
}

async function main() {
  const files = fs.readdirSync(__dirname).filter((f) => /^supabase_export_.*\.json$/.test(f))
  if (files.length === 0) {
    console.error('No export JSON found')
    process.exit(1)
  }
  files.sort()
  const latest = files[files.length - 1]
  const all = JSON.parse(fs.readFileSync(path.join(__dirname, latest), 'utf-8'))
  const outPath = path.join(__dirname, `supabase_data_inserts_${latest.replace('supabase_export_', '').replace('.json', '')}.sql`)
  const lines: string[] = []
  lines.push('-- SnapNext SaaS - Data export (PostgreSQL insert statements)')
  lines.push(`-- Source: ${latest}`)
  lines.push(`-- Generated: ${new Date().toISOString()}`)
  lines.push('')

  const tableNames: Record<string, string> = {
    tenant: 'tenants',
    outlet: 'outlets',
    outletConfig: 'outlet_configs',
    user: 'users',
    frameTemplate: 'frame_templates',
    sessionPhoto: 'session_photos',
    voucher: 'vouchers',
    transaction: 'transactions',
    boothHeartbeat: 'booth_heartbeats',
    galleryQueue: 'gallery_queue',
    testimonial: 'testimonials',
    brandAsset: 'brand_assets',
    apiKey: 'api_keys',
  }

  for (const [model, rows] of Object.entries(all)) {
    const tbl = `"${tableNames[model] ?? model}"`
    const arr = rows as Record<string, unknown>[]
    lines.push(`-- ===== ${model} (${arr.length} rows) =====`)
    if (arr.length === 0) {
      lines.push(`-- (empty)`);
      lines.push('')
      continue
    }
    const keys = Object.keys(arr[0])
    const cols = keys.map(colName).join(', ')
    for (const row of arr) {
      const vals = keys.map((k) => toSql(row[k])).join(', ')
      lines.push(`INSERT INTO ${tbl} (${cols}) VALUES (${vals});`)
    }
    lines.push('')
  }

  // enums
  lines.push('-- ===== ENUMS =====')
  lines.push("DO $$ BEGIN")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN CREATE TYPE \"SubscriptionPlan\" AS ENUM ('FREE','STARTER','PRO','ENTERPRISE'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN CREATE TYPE \"UserRole\" AS ENUM ('SUPER_ADMIN','OWNER','MANAGER','STAFF'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionStatus') THEN CREATE TYPE \"SessionStatus\" AS ENUM ('CAPTURING','PROCESSING','COMPLETED','FAILED'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN CREATE TYPE \"PaymentMethod\" AS ENUM ('CASH','QRIS','VOUCHER','GATEWAY'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN CREATE TYPE \"PaymentStatus\" AS ENUM ('PENDING','PAID','FAILED'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionStatus') THEN CREATE TYPE \"TransactionStatus\" AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentGateway') THEN CREATE TYPE \"PaymentGateway\" AS ENUM ('TOKOPAY','MIDTRANS','DOKU'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FrameType') THEN CREATE TYPE \"FrameType\" AS ENUM ('FOUR_R','A4_NEWSPAPER','CUSTOM'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BoothStatus') THEN CREATE TYPE \"BoothStatus\" AS ENUM ('ONLINE','OFFLINE','ERROR'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoucherType') THEN CREATE TYPE \"VoucherType\" AS ENUM ('PERCENTAGE','FIXED'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoucherUsage') THEN CREATE TYPE \"VoucherUsage\" AS ENUM ('SINGLE_USE','MULTI_USE'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GalleryType') THEN CREATE TYPE \"GalleryType\" AS ENUM ('PHOTO','GIF','NEWSPAPER'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UploadStatus') THEN CREATE TYPE \"UploadStatus\" AS ENUM ('PENDING','UPLOADING','COMPLETED','FAILED'); END IF;")
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BrandAssetType') THEN CREATE TYPE \"BrandAssetType\" AS ENUM ('HERO_IMAGE','LOGO','FAVICON','BANNER'); END IF;")
  lines.push("END $$;")

  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log('SQL data export ->', outPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})