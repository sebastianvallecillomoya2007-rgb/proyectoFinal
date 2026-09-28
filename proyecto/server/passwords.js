import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
export const publicUser = ({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt })
export function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + scryptSync(password, salt, 64).toString('hex')
}
export function matches(password, stored) {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored || '')) return false
  return timingSafeEqual(Buffer.from(passwordHash(password, stored.split(':')[0])), Buffer.from(stored))
}
