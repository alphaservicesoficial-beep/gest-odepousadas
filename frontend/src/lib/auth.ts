// src/lib/auth.ts

export type Role = "admin" | "recepcionista" | "camareira";

const AUTH_KEY = "isAuthenticated";
const ROLE_KEY = "role";
const USER_KEY = "user";

/**
 * Salva sessão e papel do usuário
 */
export function setSession(role: Role, name?: string) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(ROLE_KEY, role);
  if (name) {
    localStorage.setItem(USER_KEY, JSON.stringify({ name, role }));
  }
}

/**
 * Retorna se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

/**
 * Retorna o papel atual (admin, recepcionista, camareira)
 */
export function getRole(): Role | null {
  const r = localStorage.getItem(ROLE_KEY);
  if (r === "admin" || r === "recepcionista" || r === "camareira") return r;
  return null;
}

/**
 * Retorna o usuário completo (nome e papel)
 */
export function getUser():
  | { name: string; role: Role }
  | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Salva o usuário completo (nome e papel)
 */
export function setUser(user: { name: string; role: Role }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Limpa tudo (logout)
 */
export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}
