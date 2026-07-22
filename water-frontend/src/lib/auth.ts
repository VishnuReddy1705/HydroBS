const TOKEN_KEY = "hydrobs_token"
const REFRESH_TOKEN_KEY = "hydrobs_refresh_token"
const ROLE_KEY = "hydrobs_role"
const NAME_KEY = "hydrobs_name"
const COMM_KEY = "hydrobs_community_id"

export function saveSession(token: string, refreshToken: string, role: string, fullName: string, communityId?: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  sessionStorage.setItem(ROLE_KEY, role)
  sessionStorage.setItem(NAME_KEY, fullName)
  if (communityId) sessionStorage.setItem(COMM_KEY, communityId)

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(NAME_KEY, fullName)
  if (communityId) localStorage.setItem(COMM_KEY, communityId)
}

export function updateAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getRole() {
  return sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY)
}

export function getName() {
  return sessionStorage.getItem(NAME_KEY) || localStorage.getItem(NAME_KEY)
}

export function getCommunityId() {
  return sessionStorage.getItem(COMM_KEY) || localStorage.getItem(COMM_KEY)
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(NAME_KEY)
  sessionStorage.removeItem(COMM_KEY)

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
  localStorage.removeItem(COMM_KEY)
}