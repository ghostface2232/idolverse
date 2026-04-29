const BASE = import.meta.env.VITE_ASSET_BASE_URL ?? "/images";

export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${normalized}`;
}
