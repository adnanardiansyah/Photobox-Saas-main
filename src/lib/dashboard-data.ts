export function mapOutlet(outlet: any) {
  const heartbeat = outlet.heartbeats?.[0]
  const online = heartbeat && Date.now() - new Date(heartbeat.lastSeen).getTime() < 5 * 60000
  let methods = outlet.config?.paymentMethods || {}
  if (typeof methods === 'string') {
    try {
      methods = JSON.parse(methods)
    } catch {
      methods = {}
    }
  }
  return {
    id: outlet.id,
    name: outlet.name,
    latitude: outlet.latitude,
    longitude: outlet.longitude,
    location: outlet.address || '',
    mapsUrl:
      outlet.latitude != null && outlet.longitude != null
        ? `https://maps.google.com/maps?q=${outlet.latitude},${outlet.longitude}&output=embed`
        : '',
    status: online ? heartbeat.status.toLowerCase() : 'offline',
    features: {
      qris: methods.qris === true,
      voucher: methods.voucher === true,
      cashless: methods.qris === true,
    },
    lastHeartbeat: heartbeat?.lastSeen || '',
    createdAt: outlet.createdAt,
  }
}
export function mapBranding(tenant: any) {
  return {
    companyName: tenant.name,
    logoUrl: tenant.logoUrl || '',
    primaryColor: tenant.primaryColor,
    heroBannerUrl: tenant.brandAssets?.find((a: any) => a.type === 'HERO_IMAGE')?.url || '',
    secondaryColor: '#ec4899',
    tagline: 'Capture Your Moments',
  }
}
