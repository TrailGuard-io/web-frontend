export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

export const buildApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
