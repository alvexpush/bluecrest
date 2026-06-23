export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || payload?.message || 'Request failed');
  }
  return payload.data as T;
}
