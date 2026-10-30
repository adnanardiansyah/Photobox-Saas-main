import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters')
  return secret
}
const COOKIE_NAME = 'snapnext_token'

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
  tenantId: string
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '8h', algorithm: 'HS256' })
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as AuthTokenPayload
}

export function signBoothToken(apiKeyId: string) {
  return jwt.sign({ apiKeyId, purpose: 'booth' }, jwtSecret(), { expiresIn: '12h', algorithm: 'HS256' })
}

export function verifyBoothToken(token: string) {
  const payload = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] }) as jwt.JwtPayload
  if (payload.purpose !== 'booth' || typeof payload.apiKeyId !== 'string') throw new Error('Invalid booth token')
  return payload.apiKeyId
}

export function getAuthCookieName() {
  return COOKIE_NAME
}
