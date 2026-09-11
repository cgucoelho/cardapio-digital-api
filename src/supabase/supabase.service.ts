import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, SupabaseClientOptions, createClient } from '@supabase/supabase-js';
// Import nomeado, não default: este tsconfig não liga `esModuleInterop`, e o
// `ws` é CommonJS puro — `import WebSocket from 'ws'` compila pra
// `require('ws').default`, que é undefined, e o transporte chegaria vazio.
import { WebSocket } from 'ws';

/**
 * Client único do Supabase, criado com a SERVICE_ROLE key (roda só no
 * servidor, e é ela que ignora a RLS — ver o aviso no items.repository).
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(config: ConfigService) {
    const opcoes: SupabaseClientOptions<'public'> = {
      auth: { persistSession: false, autoRefreshToken: false },
    };

    // O supabase-js monta o Realtime dentro do createClient, mesmo sem
    // ninguém assinar canal nenhum, e estoura em Node sem WebSocket nativo
    // (< 22). A imagem de produção é node:22, mas o dev na VPS roda no Node 20
    // do /opt/node20 — sem isto, a API não sobe lá.
    if (typeof globalThis.WebSocket === 'undefined') {
      opcoes.realtime = { transport: WebSocket as never };
    }

    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      opcoes,
    );
  }
}
