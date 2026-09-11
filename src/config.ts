/**
 * O Supabase deixou de ser opcional: é o banco, o storage e o login do
 * produto. O modo local (.data/items.json + uploads/) existia enquanto o
 * cliente não passava credenciais e foi aposentado na virada multi-tenant —
 * ele nunca teria RLS nem login, e mantê-lo dobrava cada mudança daqui pra
 * frente. Está no histórico do git se algum dia fizer falta.
 */
export function exigirSupabase(): void {
  const faltando = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter(
    (nome) => !process.env[nome]?.trim(),
  );

  if (faltando.length > 0) {
    throw new Error(
      `A API não sobe sem Supabase. Defina ${faltando.join(' e ')} no .env — ` +
        'veja .env.example e rode supabase/schema.sql no projeto.',
    );
  }
}

/**
 * A anon key vai pro browser (é pública por design) e é o que permite o
 * Angular falar com o Supabase Auth. Sem ela o front não tem como fazer
 * login, então o /public/config avisa em vez de deixar a tela quebrar sozinha.
 */
export function anonKey(): string | null {
  return process.env.SUPABASE_ANON_KEY?.trim() || null;
}

/**
 * Slug pra onde `/` e o antigo `/cardapio` mandam o visitante. É o link que já
 * está impresso na mesa do primeiro cliente — sem isso ele cai numa tela de
 * escolha que não faz sentido pra quem só quer ver o cardápio da mesa.
 */
export function tenantPadrao(): string | null {
  return process.env.TENANT_PADRAO?.trim() || null;
}

/** Sem isso os endpoints /ai/* respondem 503 — ver GeminiService. */
export function geminiConfigurado(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
