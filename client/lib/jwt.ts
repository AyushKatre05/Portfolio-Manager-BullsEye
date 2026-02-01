interface JwtPayload {
  sub?: string
  id?: string
  name?: string
  email?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

interface UserInfo {
  id: string
  name?: string
  email?: string
}

/**
 * Decodes a JWT token without verification (for client-side use only)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) {
      return null
    }

    const payload = parts[1]
    const decoded = Buffer.from(payload, "base64").toString("utf8")
    return JSON.parse(decoded) as JwtPayload
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

/**
 * Extracts user information from JWT payload
 * Prioritizes MongoDB ObjectId (24-char hex) from 'id' field over 'sub'
 * @param payload - Decoded JWT payload
 * @returns User information object
 */
export function extractUserFromPayload(payload: JwtPayload): UserInfo | null {
  if (!payload) {
    return null
  }

  // Prioritize 'id' field if it looks like a MongoDB ObjectId
  const userId =
    payload.id &&
    typeof payload.id === "string" &&
    payload.id.length === 24 &&
    /^[0-9a-f]{24}$/i.test(payload.id)
      ? payload.id
      : payload.sub ?? payload.id

  if (!userId) {
    return null
  }

  return {
    id: userId as string,
    name: payload.name as string | undefined,
    email: payload.email as string | undefined,
  }
}

/**
 * Decodes JWT and extracts user information in one call
 * @param token - JWT token string
 * @returns User information or null
 */
export function getUserFromToken(token: string): UserInfo | null {
  const payload = decodeJwt(token)
  if (!payload) {
    return null
  }
  return extractUserFromPayload(payload)
}

/**
 * Checks if a JWT token is expired
 * @param token - JWT token string
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload || !payload.exp) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}
