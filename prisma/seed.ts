// ============================================
// Prisma Seed - Dummy Data for Local Demo
// ============================================

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production')
  console.log('🌱 Starting seed...')

  // ============================================
  // 1. Create Tenant (Vendor/Owner)
  // ============================================
  const tenant = await prisma.tenant.upsert({
    where: { email: 'admin@snapnext.id' },
    update: {},
    create: {
      name: 'SnapNext Demo',
      email: 'admin@snapnext.id',
      phone: '+6281234567890',
      logoUrl: '/logo.png',
      primaryColor: '#9333ea',
      subscriptionPlan: 'PRO',
      isActive: true,
    },
  })
  console.log('✅ Created Tenant:', tenant.name)

  // ============================================
  // 2. Create User (Admin)
  // ============================================
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@snapnext.id' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@snapnext.id',
      passwordHash: await bcrypt.hash('demo123', 10),
      name: 'Admin SnapNext',
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log('✅ Created Admin User:', adminUser.email)

  // ============================================
  // 3. Create Outlets (Aceh Utara & Lhokseumawe)
  // ============================================
  const outlet1 = await prisma.outlet.upsert({
    where: { machineId: 'BOOTH-ACEH-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'SnapNext Aceh Utara',
      address: 'Jl. Tengku Amir Hamzah, Banda Aceh, Aceh',
      phone: '+6281234567891',
      latitude: 5.5577,
      longitude: 95.3193,
      operatingHours: JSON.stringify({
        monday: '09:00-21:00',
        tuesday: '09:00-21:00',
        wednesday: '09:00-21:00',
        thursday: '09:00-21:00',
        friday: '09:00-22:00',
        saturday: '09:00-22:00',
        sunday: '10:00-20:00',
      }),
      isActive: true,
      machineId: 'BOOTH-ACEH-001',
    },
  })

  const outlet2 = await prisma.outlet.upsert({
    where: { machineId: 'BOOTH-LHOKSEUMAWE-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'SnapNext Lhokseumawe',
      address: 'Jl. Merdeka, Lhokseumawe, Aceh',
      phone: '+6281234567892',
      latitude: 5.1897,
      longitude: 97.1351,
      operatingHours: JSON.stringify({
        monday: '08:00-22:00',
        tuesday: '08:00-22:00',
        wednesday: '08:00-22:00',
        thursday: '08:00-22:00',
        friday: '08:00-23:00',
        saturday: '08:00-23:00',
        sunday: '09:00-21:00',
      }),
      isActive: true,
      machineId: 'BOOTH-LHOKSEUMAWE-001',
    },
  })
  console.log('✅ Created Outlets:', outlet1.name, outlet2.name)

  // ============================================
  // 4. Create Outlet Configs
  // ============================================
  await prisma.outletConfig.upsert({
    where: { outletId: outlet1.id },
    update: {},
    create: {
      outletId: outlet1.id,
      paymentMethods: JSON.stringify({ cash: true, qris: true, voucher: true }),
      priceDefault: 25000,
      printEnabled: true,
      galleryEnabled: true,
      gifEnabled: true,
      newspaperEnabled: true,
    },
  })

  await prisma.outletConfig.upsert({
    where: { outletId: outlet2.id },
    update: {},
    create: {
      outletId: outlet2.id,
      paymentMethods: JSON.stringify({ cash: true, qris: true, voucher: true }),
      priceDefault: 25000,
      printEnabled: true,
      galleryEnabled: true,
      gifEnabled: true,
      newspaperEnabled: false,
    },
  })
  console.log('✅ Created Outlet Configs')

  // ============================================
  // 5. Create Frame Templates
  // ============================================

  // A4 Newspaper Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-a4-newspaper-001' },
    update: {},
    create: {
      id: 'frame-a4-newspaper-001',
      tenantId: tenant.id,
      name: 'A4 Newspaper Edition',
      type: 'A4_NEWSPAPER',
      imageUrl: '/frames/newspaper-a4.png',
      thumbnailUrl: '/frames/thumb-newspaper-a4.png',
      width: 2480,
      height: 3508,
      price: 35000,
      isActive: true,
    },
  })

  // 4R Classic Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-4r-classic-001' },
    update: {},
    create: {
      id: 'frame-4r-classic-001',
      tenantId: tenant.id,
      name: '4R Classic',
      type: 'FOUR_R',
      imageUrl: '/frames/4r-classic.png',
      thumbnailUrl: '/frames/thumb-4r-classic.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // GIF Animated Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-gif-animated-001' },
    update: {},
    create: {
      id: 'frame-gif-animated-001',
      tenantId: tenant.id,
      name: 'GIF Animated Frame',
      type: 'CUSTOM',
      imageUrl: '/frames/gif-animated.png',
      thumbnailUrl: '/frames/thumb-gif-animated.png',
      width: 1080,
      height: 1080,
      price: 30000,
      isActive: true,
    },
  })

  // Korean Style Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-korean-001' },
    update: {},
    create: {
      id: 'frame-korean-001',
      tenantId: tenant.id,
      name: 'Korean Style',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-korean-1200x1800.png',
      thumbnailUrl: '/photos/frame-korean-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // Nature Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-nature-001' },
    update: {},
    create: {
      id: 'frame-nature-001',
      tenantId: tenant.id,
      name: 'Natural',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-nature-1200x1800.png',
      thumbnailUrl: '/photos/frame-nature-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // Night Sky Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-night-001' },
    update: {},
    create: {
      id: 'frame-night-001',
      tenantId: tenant.id,
      name: 'Night Sky',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-night-1200x1800.png',
      thumbnailUrl: '/photos/frame-night-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // Floral Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-floral-001' },
    update: {},
    create: {
      id: 'frame-floral-001',
      tenantId: tenant.id,
      name: 'Floral',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-floral-1200x1800.png',
      thumbnailUrl: '/photos/frame-floral-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // Beach Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-beach-001' },
    update: {},
    create: {
      id: 'frame-beach-001',
      tenantId: tenant.id,
      name: 'Beach',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-beach-1200x1800.png',
      thumbnailUrl: '/photos/frame-beach-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  // Retro Template
  await prisma.frameTemplate.upsert({
    where: { id: 'frame-retro-001' },
    update: {},
    create: {
      id: 'frame-retro-001',
      tenantId: tenant.id,
      name: 'Retro',
      type: 'CUSTOM',
      imageUrl: '/photos/frame-retro-1200x1800.png',
      thumbnailUrl: '/photos/frame-retro-1200x1800.png',
      width: 1200,
      height: 1800,
      price: 25000,
      isActive: true,
    },
  })

  console.log('✅ Created Frame Templates')

  // ============================================
  // 6. Create Vouchers
  // ============================================

  // Single-use voucher (welcome offer)
  await prisma.voucher.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20, // 20% discount
      minOrder: 20000,
      maxUses: 100,
      usageType: 'SINGLE_USE',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    },
  })

  // Multi-use voucher (promo)
  await prisma.voucher.upsert({
    where: { code: 'HARGA25K' },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'HARGA25K',
      type: 'FIXED',
      value: 5000, // Rp 5,000 discount
      minOrder: 25000,
      maxUses: null, // Unlimited
      usageType: 'MULTI_USE',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isActive: true,
    },
  })

  // Another single-use voucher
  await prisma.voucher.upsert({
    where: { code: 'GRATIS10K' },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'GRATIS10K',
      type: 'FIXED',
      value: 10000, // Rp 10,000 discount
      minOrder: 30000,
      maxUses: 50,
      usageType: 'SINGLE_USE',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isActive: true,
    },
  })

  console.log('✅ Created Vouchers')

  // ============================================
  // 7. Create Testimonials
  // ============================================

  await prisma.testimonial.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet1.id,
      customerName: 'Ahmad Yusuf',
      customerPhoto: '/testimonials/ahmad.jpg',
      message: 'Sangat enjoy! Foto hasilnya bagus dan prosesnya cepat. recommend banget!',
      rating: 5,
      isApproved: true,
    },
  })

  await prisma.testimonial.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet2.id,
      customerName: 'Siti Aminah',
      message: 'Pertama kali coba photo booth, langsung jadi fans. Frame-nya aesthetic bgtt!',
      rating: 5,
      isApproved: true,
    },
  })

  await prisma.testimonial.create({
    data: {
      tenantId: tenant.id,
      outletId: outlet1.id,
      customerName: 'Budi Santoso',
      message: 'Bagus untuk acara keluarga. Anak-anak suka banget.',
      rating: 4,
      isApproved: true,
    },
  })

  console.log('✅ Created Testimonials')

  // ============================================
  // 8. Create Brand Assets
  // ============================================

  await prisma.brandAsset.create({
    data: {
      tenantId: tenant.id,
      type: 'HERO_IMAGE',
      url: '/brand/hero-default.jpg',
      isActive: true,
    },
  })

  await prisma.brandAsset.create({
    data: {
      tenantId: tenant.id,
      type: 'LOGO',
      url: '/brand/logo.png',
      isActive: true,
    },
  })

  await prisma.brandAsset.create({
    data: {
      tenantId: tenant.id,
      type: 'FAVICON',
      url: '/brand/favicon.ico',
      isActive: true,
    },
  })

  console.log('✅ Created Brand Assets')

  // ============================================
  // 9. Create API Keys for Booth machines
  // ============================================

  await prisma.apiKey.upsert({
    where: { key: 'demo-key-booth-aceh-001' },
    update: {},
    create: {
      key: 'demo-key-booth-aceh-001',
      outletId: outlet1.id,
      name: 'Aceh Utara Booth',
      permissions: JSON.stringify(['capture', 'upload', 'print']),
      isActive: true,
    },
  })

  await prisma.apiKey.upsert({
    where: { key: 'demo-key-booth-lhokseumawe-001' },
    update: {},
    create: {
      key: 'demo-key-booth-lhokseumawe-001',
      outletId: outlet2.id,
      name: 'Lhokseumawe Booth',
      permissions: JSON.stringify(['capture', 'upload', 'print']),
      isActive: true,
    },
  })

  console.log('✅ Created API Keys')

  // ============================================
  // 10. Create Sample SessionPhoto (Gallery Data)
  // ============================================

  // Sample session 1 - Aceh Utara outlet
  await prisma.sessionPhoto.upsert({
    where: { galleryCode: 'ABC123DEF456' },
    update: {},
    create: {
      outletId: outlet1.id,
      frameId: 'frame-4r-classic-001',
      sessionCode: 'SESSION-ACEH-001',
      status: 'COMPLETED',
      photos: JSON.stringify([
        'https://picsum.photos/400/600?random=1',
        'https://picsum.photos/400/600?random=2',
        'https://picsum.photos/400/600?random=3',
        'https://picsum.photos/400/600?random=4',
      ]),
      gifUrl: 'https://picsum.photos/400/600?random=gif1',
      totalPrice: 25000,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      galleryCode: 'ABC123DEF456',
      galleryExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    },
  })

  // Sample session 2 - Lhokseumawe outlet
  await prisma.sessionPhoto.upsert({
    where: { galleryCode: 'XYZ789UVW012' },
    update: {},
    create: {
      outletId: outlet2.id,
      frameId: 'frame-a4-newspaper-001',
      sessionCode: 'SESSION-LHOK-001',
      status: 'COMPLETED',
      photos: JSON.stringify([
        'https://picsum.photos/400/600?random=5',
        'https://picsum.photos/400/600?random=6',
        'https://picsum.photos/400/600?random=7',
        'https://picsum.photos/400/600?random=8',
      ]),
      newspaperUrl: '/photos/sample-newspaper.pdf',
      totalPrice: 35000,
      paymentMethod: 'QRIS',
      paymentStatus: 'PAID',
      galleryCode: 'XYZ789UVW012',
      galleryExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Sample session 3 - Another session
  await prisma.sessionPhoto.upsert({
    where: { galleryCode: 'DEMO1234ABCD' },
    update: {},
    create: {
      outletId: outlet1.id,
      frameId: 'frame-gif-animated-001',
      sessionCode: 'SESSION-ACEH-002',
      status: 'COMPLETED',
      photos: JSON.stringify([
        'https://picsum.photos/400/600?random=9',
        'https://picsum.photos/400/600?random=10',
      ]),
      gifUrl: 'https://picsum.photos/400/600?random=gif2',
      totalPrice: 30000,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      voucherCode: 'WELCOME20',
      galleryCode: 'DEMO1234ABCD',
      galleryExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✅ Created Sample Gallery Data')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('   Email: admin@snapnext.id')
  console.log('   Password: demo123')
  console.log('\n📍 Outlets:')
  console.log('   - Aceh Utara (BOOTH-ACEH-001)')
  console.log('   - Lhokseumawe (BOOTH-LHOKSEUMAWE-001)')
  console.log('\n🎫 Active Vouchers:')
  console.log('   - WELCOME20 (20% off, single-use)')
  console.log('   - HARGA25K (Rp 5,000 off, multi-use)')
  console.log('   - GRATIS10K (Rp 10,000 off, single-use)')
  console.log('\n📸 Sample Galleries:')
  console.log('   - Gallery Code: ABC123DEF456')
  console.log('   - Gallery Code: XYZ789UVW012')
  console.log('   - Gallery Code: DEMO1234ABCD')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })