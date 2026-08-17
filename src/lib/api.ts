const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      console.warn(`Backend request failed: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn(`Backend connection error for ${endpoint}:`, error);
    return null;
  }
}
