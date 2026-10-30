// ============================================
// Gallery Code Generator Utility
// Generates unique gallery codes for new photo sessions
// ============================================

import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

/**
 * Generate a unique gallery code
 * 128-bit random bearer code for public gallery access.
 */
export async function generateUniqueGalleryCode(): Promise<string> {
  // Database uniqueness remains the final authority; creation retries a collision.
  return randomBytes(16).toString('hex').toUpperCase()

}

/**
 * Check if a gallery code is available
 */
export async function isGalleryCodeAvailable(code: string): Promise<boolean> {
  const existing = await prisma.sessionPhoto.findUnique({
    where: { galleryCode: code },
  })
  return !existing
}

/**
 * Create a new photo session with unique gallery code
 */
export async function createNewPhotoSession(outletId: string, frameId?: string, totalPrice = 0) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const galleryCode = await generateUniqueGalleryCode()
    try {
      return await prisma.sessionPhoto.create({ data: {
        outletId, frameId, sessionCode: `SESSION-${galleryCode}`,
        status: 'CAPTURING', photos: [], totalPrice,
        paymentStatus: 'PENDING', galleryCode,
        galleryExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } })
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002' || attempt === 2) throw error
    }
  }
  throw new Error('Could not allocate session')
}
