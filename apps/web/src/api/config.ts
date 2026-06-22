const base = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export function apiUrl(path: string): string {
  return `${base}${path}`;
}
