/**
 * O backend roda em dois modos:
 *
 *  - supabase: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY definidos (modo oficial).
 *  - local:    sem credenciais — persiste em .data/items.json e uploads/,
 *              pra demo rodar de imediato. Mesmo contrato de repositório.
 */
export function modoSupabase(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
