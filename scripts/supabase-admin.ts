import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Lê o api/.env sem depender do dotenv: o pacote só existe aqui de carona no
 * @nestjs/config, e script de manutenção não é lugar pra descobrir isso na
 * hora errada. Variável já definida no ambiente ganha do arquivo.
 */
function carregarEnv(): void {
  const caminho = resolve(__dirname, '..', '.env');
  if (!existsSync(caminho)) return;

  for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) continue;

    const igual = limpa.indexOf('=');
    if (igual < 1) continue;

    const chave = limpa.slice(0, igual).trim();
    const valor = limpa.slice(igual + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[chave]) process.env[chave] = valor;
  }
}

/**
 * Client de service_role pros scripts de manutenção (criar tenant, migrar
 * dados). Fora da aplicação de propósito: são coisas que se roda na mão, com
 * a chave que ignora RLS, e não é pra existir rota HTTP que faça isso.
 */
export function admin(): SupabaseClient {
  carregarEnv();

  const url = process.env.SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !chave) {
    throw new Error(
      'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no api/.env antes de rodar este script.',
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Lê `--chave valor` da linha de comando. */
export function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  const valor = i >= 0 ? process.argv[i + 1] : undefined;
  return valor && !valor.startsWith('--') ? valor : undefined;
}

export function temFlag(nome: string): boolean {
  return process.argv.includes(`--${nome}`);
}

/**
 * Slugs que colidiriam com rota da API (`/public/config`) ou do Angular
 * (`/admin`, `/login`). Barrar aqui é mais barato que descobrir depois que o
 * cardápio de um cliente abre a tela de login.
 */
export const SLUGS_RESERVADOS = [
  'config',
  'admin',
  'login',
  'api',
  'public',
  'cardapio',
  'c',
];

export function validarSlug(slug: string): void {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length < 3 || slug.length > 40) {
    throw new Error(
      `Slug inválido: "${slug}". Use de 3 a 40 caracteres, só minúsculas, números e hífen no meio.`,
    );
  }
  if (SLUGS_RESERVADOS.includes(slug)) {
    throw new Error(`Slug reservado: "${slug}". Escolha outro.`);
  }
}
