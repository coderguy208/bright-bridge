// Vite replaces DEV with false in a production build, making this branch unreachable there.
export const isMockAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true'

const MOCK_SESSION_KEY = 'brightbridge.mock-authenticated'
const mockUser = {
  id: 'brightbridge-local-demo-user',
  email: 'demo@brightbridge.local',
  name: 'BrightBridge Demo',
  user_metadata: { brightbridge_onboarded: true },
  async jwt() { return 'local-development-token' },
  async update({ data }) {
    this.user_metadata = { ...this.user_metadata, ...data }
    return this
  },
}

let netlifyIdentity = null
let identityLoadPromise = null
const mockListeners = new Set()

function mockIsSignedIn() {
  return window.localStorage.getItem(MOCK_SESSION_KEY) === 'true'
}

function notifyMock(event, user) {
  mockListeners.forEach((listener) => listener(event, user))
}

// The widget is deliberately loaded only for the real auth path. In mock mode it is never imported.
function loadNetlifyIdentity() {
  if (isMockAuthEnabled) return Promise.resolve(null)
  if (netlifyIdentity) return Promise.resolve(netlifyIdentity)
  if (!identityLoadPromise) {
    identityLoadPromise = import('netlify-identity-widget').then((module) => {
      netlifyIdentity = module.default
      return netlifyIdentity
    })
  }
  return identityLoadPromise
}

const IDENTITY_CALLBACK_PATTERN = /(?:access_token|confirmation_token|invite_token|recovery_token|email_change_token|error=access_denied)=?/
let identityCallbackPending = IDENTITY_CALLBACK_PATTERN.test(window.location.hash)

// Decode only display/onboarding claims from the widget JWT; authorization still uses user.jwt().
function decodeJwtClaims(tokenValue) {
  if (typeof tokenValue !== 'string') return {}

  const encodedPayload = tokenValue.split('.')[1]
  if (!encodedPayload) return {}

  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return {}
  }
}

function getIdentityClaims(user) {
  const tokenDetails = typeof user?.tokenDetails === 'function'
    ? user.tokenDetails()
    : user?.token
  return decodeJwtClaims(tokenDetails?.access_token || tokenDetails?.id_token)
}

function getIdentityMetadata(user) {
  const claims = getIdentityClaims(user)
  return {
    ...(claims.user_metadata || {}),
    ...(user?.userMetadata || {}),
    ...(user?.user_metadata || {}),
  }
}

function firstIdentityData(user) {
  if (!Array.isArray(user?.identities)) return {}
  return user.identities.find((identity) => identity?.identity_data)?.identity_data || {}
}

function normalizeDisplayName(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const trimmed = value.trim()
  return trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
}

// Read the widget-owned user instead of keeping a second JWT or user snapshot.
export function loadCurrentUser() {
  if (isMockAuthEnabled) return mockIsSignedIn() ? mockUser : null
  return netlifyIdentity?.currentUser() || null
}

export function isIdentityReady() {
  return isMockAuthEnabled || Boolean(netlifyIdentity?.store?.gotrue)
}

// Tell the router when the widget completed an OAuth, confirmation, invite, or recovery callback.
export function consumeIdentityCallback() {
  if (isMockAuthEnabled) return false
  // Wait until the widget has consumed the hash; a restored stale user may arrive first.
  if (IDENTITY_CALLBACK_PATTERN.test(window.location.hash)) return false
  const pending = identityCallbackPending
  identityCallbackPending = false
  return pending
}

// Normalize widget events and cross-tab session changes for the React auth provider.
export function subscribeToAuthChanges(callback) {
  if (isMockAuthEnabled) {
    mockListeners.add(callback)
    callback('init', loadCurrentUser())
    return () => mockListeners.delete(callback)
  }

  let cancelled = false
  let removeListeners = () => {}
  loadNetlifyIdentity().then((identity) => {
    if (cancelled) return
  const handleInit = (user) => callback('init', user || null)
  const handleLogin = (user) => {
    netlifyIdentity.close()
    callback('login', user || null)
  }
  const handleLogout = () => callback('logout', null)
  const handleError = (error) => callback('error', error)
  const handleStorage = (event) => {
    if (event.key !== 'gotrue.user') return
    queueMicrotask(() => callback('storage', loadCurrentUser()))
  }

  identity.on('init', handleInit)
  identity.on('login', handleLogin)
  identity.on('logout', handleLogout)
  identity.on('error', handleError)
  window.addEventListener('storage', handleStorage)
  removeListeners = () => {
    identity.off('init', handleInit)
    identity.off('login', handleLogin)
    identity.off('logout', handleLogout)
    identity.off('error', handleError)
    window.removeEventListener('storage', handleStorage)
  }
  callback('init', identity.currentUser() || null)
  }).catch((error) => callback('error', error))

  return () => {
    cancelled = true
    removeListeners()
  }
}

// The widget contains email login, signup, recovery, invite handling, and enabled OAuth providers.
export async function openLoginWidget() {
  if (isMockAuthEnabled) {
    window.localStorage.setItem(MOCK_SESSION_KEY, 'true')
    notifyMock('login', mockUser)
    return
  }
  const identity = await loadNetlifyIdentity()
  identity.open('login')
}

export async function signOut() {
  if (isMockAuthEnabled) {
    window.localStorage.removeItem(MOCK_SESSION_KEY)
    notifyMock('logout', null)
    return
  }
  const identity = await loadNetlifyIdentity()
  await identity.logout()
}

// Refresh through the widget before authenticated API calls; never persist another token copy.
export async function getAccessToken() {
  if (isMockAuthEnabled) return loadCurrentUser() ? 'local-development-token' : null
  const user = loadCurrentUser()
  return user ? user.jwt() : null
}

// Store onboarding state on the Identity profile so it follows the correct account.
export function markOnboardingComplete(user) {
  if (isMockAuthEnabled) {
    mockUser.user_metadata.brightbridge_onboarded = true
    return Promise.resolve(mockUser)
  }
  const metadata = getIdentityMetadata(user)
  return user.update({
    data: {
      ...metadata,
      brightbridge_onboarded: true,
    },
  })
}

// Prefer provider/profile metadata and fall back to the email prefix for a friendly greeting.
export function getDisplayName(user) {
  const metadata = getIdentityMetadata(user)
  const claims = getIdentityClaims(user)
  const providerData = firstIdentityData(user)
  const candidates = [
    user?.name,
    metadata.full_name,
    metadata.name,
    providerData.full_name,
    providerData.name,
    claims.name,
    user?.email,
    providerData.email,
    claims.email,
  ]

  for (const value of candidates) {
    const displayName = normalizeDisplayName(value)
    if (displayName) return displayName
  }

  return 'User'
}

export function hasCompletedOnboarding(user) {
  const metadata = getIdentityMetadata(user)
  return metadata.brightbridge_onboarded === true
}
