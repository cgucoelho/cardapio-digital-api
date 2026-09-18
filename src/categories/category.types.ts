/** Categoria do cardápio, por loja. */
export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export function paraCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}
