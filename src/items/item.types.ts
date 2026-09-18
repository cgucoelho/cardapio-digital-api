// ⚠️ Esta lista tem três cópias que precisam andar juntas: aqui, no
// web/src/app/core/item.model.ts e no check da coluna em supabase/schema.sql.
// Adicionar categoria só num dos lados cria item que a API aceita e a vitrine
// não mostra (ou que o Postgres rejeita, no modo Supabase).
export const CATEGORIAS = [
  'Bebidas',
  'Doces',
  'Salgados',
  'Refeições',
  'Outros',
] as const;

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
