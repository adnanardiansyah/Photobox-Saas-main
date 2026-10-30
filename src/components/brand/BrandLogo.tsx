'use client'

import { useState } from 'react'

type BrandLogoProps = {
  logoUrl?: string
  companyName?: string
  tone?: 'auto' | 'light' | 'dark'
  compact?: boolean
  className?: string
}

const builtInLogos = new Set([
  '/logo.png',
  '/brand/logo-light.png',
  '/brand/logo-dark.png',
  '/icon.svg',
])

export function BrandLogo({
  logoUrl,
  companyName = 'SnapNext',
  tone = 'auto',
  compact = false,
  className = '',
}: BrandLogoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const customLogo = logoUrl && !builtInLogos.has(logoUrl) && logoUrl !== failedUrl
  if (customLogo)
    return (
      <img
        src={logoUrl}
        alt={companyName}
        decoding="async"
        onError={() => setFailedUrl(logoUrl)}
        className={`max-w-full object-contain ${className}`}
      />
    )
  if (compact)
    return (
      <img
        src="/icon.svg"
        width={200}
        height={200}
        alt={companyName}
        decoding="async"
        className={`shrink-0 object-contain ${className}`}
      />
    )
  const imageClass = `max-w-full object-contain ${className}`
  if (tone !== 'auto')
    return (
      <img
        src={tone === 'dark' ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
        width={1740}
        height={435}
        alt={companyName}
        decoding="async"
        className={imageClass}
      />
    )
  return (
    <>
      <img
        src="/brand/logo-light.png"
        width={1740}
        height={435}
        alt={companyName}
        decoding="async"
        className={`block dark:hidden ${imageClass}`}
      />
      <img
        src="/brand/logo-dark.png"
        width={1740}
        height={435}
        alt={companyName}
        decoding="async"
        className={`hidden dark:block ${imageClass}`}
      />
    </>
  )
}
