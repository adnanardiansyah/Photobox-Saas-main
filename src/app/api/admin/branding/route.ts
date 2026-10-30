import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, apiError, ApiError, validPhotoUrl } from '@/lib/api-security'
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin(request, true)
    const { companyName, primaryColor, logoUrl, heroBannerUrl } = await request.json()
    if (
      typeof companyName !== 'string' ||
      !companyName.trim() ||
      companyName.length > 100 ||
      !/^#[0-9a-f]{6}$/i.test(primaryColor)
    )
      throw new ApiError(400, 'Nama atau warna tidak valid')
    const prefix = `assets/${user.tenantId}/`
    for (const url of [logoUrl, heroBannerUrl])
      if (
        url &&
        url !== user.tenant.logoUrl &&
        !validPhotoUrl(url, prefix) &&
        !(
          typeof url === 'string' &&
          /^\/(photos|templates)\/[a-zA-Z0-9 _./-]+$/.test(url) &&
          !url.includes('..')
        )
      )
        throw new ApiError(400, 'Unggah aset terlebih dahulu')
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: user.tenantId },
        data: { name: companyName.trim(), primaryColor, logoUrl: logoUrl || null },
      })
      await tx.brandAsset.updateMany({
        where: { tenantId: user.tenantId, type: 'HERO_IMAGE' },
        data: { isActive: false },
      })
      if (heroBannerUrl)
        await tx.brandAsset.create({
          data: { tenantId: user.tenantId, type: 'HERO_IMAGE', url: heroBannerUrl },
        })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
