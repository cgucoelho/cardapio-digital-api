import { InternalServerErrorException, Logger } from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Trata erro do Supabase sem vazar o texto cru pro cliente.
 *
 * `throw new InternalServerErrorException(error.message)` parece inofensivo,
 * mas o `message` do supabase-js pode carregar detalhe de schema, ou — quando
 * o projeto está atrás de um WAF (Cloudflare) — a página de bloqueio inteira,
 * com IP do servidor. O detalhe vai pro log; o cliente recebe uma frase fixa.
 */
export function falhaSupabase(
  logger: Logger,
  contexto: string,
  erro: PostgrestError | { message?: string } | null,
): never {
  logger.error(`${contexto}: ${erro?.message ?? 'erro desconhecido'}`);
  throw new InternalServerErrorException(
    'Erro ao acessar os dados. Tente de novo em instantes.',
  );
}
