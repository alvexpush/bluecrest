export function getAuthToken() {
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
}

export function getAuthUser() {
  return sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
}

export function storeAuthSession(token: string, user: string, keepSignedIn: boolean) {
  const target = keepSignedIn ? localStorage : sessionStorage;
  const other = keepSignedIn ? sessionStorage : localStorage;
  other.removeItem('auth_token');
  other.removeItem('auth_user');
  target.setItem('auth_token', token);
  target.setItem('auth_user', user);
}

export function updateStoredAuthUser(user: string) {
  const target = sessionStorage.getItem('auth_token') ? sessionStorage : localStorage;
  target.setItem('auth_user', user);
}

export function clearAuthSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem('auth_token');
    storage.removeItem('auth_user');
  }
}
