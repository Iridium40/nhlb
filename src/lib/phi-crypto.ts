/**
 * AES-256-GCM encryption for PHI fields.
 *
 * Generate key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Required env var: PHI_ENCRYPTION_KEY (64-char hex string)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.PHI_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('PHI_ENCRYPTION_KEY must be a 64-character hex string')
  }
  return Buffer.from(hex, 'hex')
}

/** Encrypt a PHI string. Returns base64 packed as iv:authTag:ciphertext */
export function encryptPHI(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

/** Decrypt a PHI string. Returns null if value is null/undefined. */
export function decryptPHI(packed: string | null | undefined): string | null {
  if (!packed) return null
  const parts = packed.split(':')
  if (parts.length !== 3) return packed
  const [ivB64, authTagB64, ciphertextB64] = parts
  const key = getKey()
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/** Encrypt only if value is non-empty. */
export function encryptIfPresent(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return encryptPHI(value.trim())
}
