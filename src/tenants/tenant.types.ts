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
  // Delivery (camelCase pro front). deliveryFee em reais; minOrder null = sem mínimo.
  deliveryFee: number;
  minOrder: number | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
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
  delivery_fee: number | string;
  min_order: number | string | null;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
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
    // numeric do Postgres pode chegar como string dependendo do driver.
    deliveryFee: Number(row.delivery_fee),
    minOrder: row.min_order === null ? null : Number(row.min_order),
    acceptsDelivery: row.accepts_delivery,
    acceptsPickup: row.accepts_pickup,
    active: row.active,
    createdAt: row.created_at,
  };
}
