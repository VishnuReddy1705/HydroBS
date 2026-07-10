const TOKEN_KEY = "hydrobs_token"
const ROLE_KEY = "hydrobs_role"
const NAME_KEY = "hydrobs_name"

export function saveSession(token: string, role: string, fullName: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(NAME_KEY, fullName)
}
export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function getRole() { return localStorage.getItem(ROLE_KEY) }
export function getName() { return localStorage.getItem(NAME_KEY) }
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
}