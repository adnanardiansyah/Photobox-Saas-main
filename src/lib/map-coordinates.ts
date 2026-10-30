export function mapCoordinates(value: string): { latitude: number; longitude: number } | null {
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      !['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname)
    )
      return null
    const text = decodeURIComponent(url.href)
    const pair = (
      url.searchParams.get('q') ||
      url.searchParams.get('query') ||
      url.searchParams.get('ll') ||
      ''
    ).match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
    const at = text.match(/@(-?[0-9.]+),(-?[0-9.]+)/)
    const lat = text.match(/!3d(-?[0-9.]+)/)?.[1]
    const lon = text.match(/!2d(-?[0-9.]+)/)?.[1]
    const latitude = Number(lat || pair?.[1] || at?.[1])
    const longitude = Number(lon || pair?.[2] || at?.[2])
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      return null
    return { latitude, longitude }
  } catch {
    return null
  }
}
