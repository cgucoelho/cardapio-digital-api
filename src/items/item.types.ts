/**
 * Formato devolvido pela API (camelCase). No Postgres as colunas são snake_case.
 *
 * `category` é o NOME de uma categoria da loja (texto livre, definido pelo
 * lojista em public.categories). A validação de que o nome existe é feita no
 * ItemsService contra as categorias do tenant — não há mais lista fixa.
 */
export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
}
