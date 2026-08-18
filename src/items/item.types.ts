export const CATEGORIAS = ['Bebidas', 'Doces', 'Salgados', 'Outros'] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/** Formato devolvido pela API (camelCase). No Postgres as colunas são snake_case. */
export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: Categoria;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
}
