/** Formato devolvido pela API (camelCase). No Postgres as colunas são snake_case. */
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  brandColor: string;
  whatsapp: string | null;
  wifi: string | null;
  active: boolean;
  createdAt: string;
}

/** Linha crua da tabela public.tenants. */
export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  brand_color: string;
  whatsapp: string | null;
  wifi: string | null;
  active: boolean;
  created_at: string;
}

export function paraTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    brandColor: row.brand_color,
    whatsapp: row.whatsapp,
    wifi: row.wifi,
    active: row.active,
    createdAt: row.created_at,
  };
}
