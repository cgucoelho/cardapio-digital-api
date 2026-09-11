/**
 * Traz o cardápio do modo local (.data/items.json + uploads/) pro Supabase,
 * dentro de um tenant. Roda uma vez por estabelecimento migrado.
 *
 *   npx ts-node scripts/migrar-para-supabase.ts \
 *     --slug cafe-da-esquina \
 *     --dados /tmp/migracao/items.json \
 *     --fotos /tmp/migracao/uploads
 *
 * O tenant precisa existir (scripts/criar-tenant.ts). Se ele já tiver itens, o
 * script para — reimportar por cima duplicaria o cardápio inteiro. Use
 * --substituir pra apagar os itens de lá antes de importar.
 *
 * As fotos viram objetos em menu-items/{tenant_id}/ e cada `/uploads/<nome>`
 * do JSON é reescrito pra URL pública nova. Foto citada no JSON que não estiver
 * na pasta vira aviso, e o item entra sem imagem em vez de quebrar a migração.
 */
import { readFileSync } from 'fs';
import { basename, join } from 'path';

import { admin, arg, temFlag } from './supabase-admin';

interface ItemLocal {
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
}

/** Só depois de admin() ter carregado o .env — no topo do módulo viria vazio. */
function bucket(): string {
  return process.env.SUPABASE_BUCKET?.trim() || 'menu-items';
}

async function main(): Promise<void> {
  const slug = arg('slug');
  const caminhoDados = arg('dados');
  const pastaFotos = arg('fotos');

  if (!slug || !caminhoDados) {
    throw new Error('Uso: --slug <slug> --dados <items.json> [--fotos <pasta>] [--substituir]');
  }

  const db = admin();

  const { data: tenant, error: erroTenant } = await db
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (erroTenant) throw new Error(`Falha ao buscar o tenant: ${erroTenant.message}`);
  if (!tenant) throw new Error(`Tenant "${slug}" não existe. Crie com scripts/criar-tenant.ts.`);

  await conferirVazio(db, tenant.id);

  const itens = JSON.parse(readFileSync(caminhoDados, 'utf8')) as ItemLocal[];
  console.log(`• ${itens.length} itens em ${caminhoDados}`);

  const urls = pastaFotos
    ? await subirFotos(db, tenant.id, pastaFotos, itens)
    : new Map<string, string>();

  const linhas = itens.map((item) => ({
    tenant_id: tenant.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image_url: novaUrl(item.imageUrl, urls),
    available: item.available,
    // Preserva a ordem original do cardápio: a listagem ordena por created_at.
    created_at: item.createdAt,
  }));

  const { error } = await db.from('items').insert(linhas);
  if (error) throw new Error(`Falha ao inserir os itens: ${error.message}`);

  const semFoto = linhas.filter((l) => l.image_url === null).length;
  console.log(`\n✔ ${linhas.length} itens migrados para ${tenant.name} (${tenant.slug})`);
  if (semFoto) console.log(`  ${semFoto} sem foto.`);
  console.log(`  Confira em /c/${tenant.slug}`);
}

async function conferirVazio(db: ReturnType<typeof admin>, tenantId: string): Promise<void> {
  const { count, error } = await db
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Falha ao checar os itens existentes: ${error.message}`);
  if (!count) return;

  if (!temFlag('substituir')) {
    throw new Error(
      `Este tenant já tem ${count} itens. Rode com --substituir pra apagar e reimportar.`,
    );
  }

  const { error: erroDelete } = await db.from('items').delete().eq('tenant_id', tenantId);
  if (erroDelete) throw new Error(`Falha ao limpar os itens: ${erroDelete.message}`);
  console.log(`• ${count} itens antigos apagados (--substituir)`);
}

/** Sobe cada foto citada no JSON e devolve o mapa nome do arquivo → URL pública. */
async function subirFotos(
  db: ReturnType<typeof admin>,
  tenantId: string,
  pasta: string,
  itens: ItemLocal[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();

  const nomes = [
    ...new Set(
      itens
        .map((i) => i.imageUrl)
        .filter((u): u is string => Boolean(u?.startsWith('/uploads/')))
        .map((u) => basename(u)),
    ),
  ];

  for (const nome of nomes) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(join(pasta, nome));
    } catch {
      console.warn(`  ! ${nome} não está em ${pasta} — o item vai ficar sem foto.`);
      continue;
    }

    const caminho = `${tenantId}/${nome}`;
    const { error } = await db.storage.from(bucket()).upload(caminho, bytes, {
      contentType: mime(nome),
      upsert: true,
    });

    if (error) throw new Error(`Falha ao subir ${nome}: ${error.message}`);

    urls.set(nome, db.storage.from(bucket()).getPublicUrl(caminho).data.publicUrl);
    console.log(`  ↑ ${nome}`);
  }

  return urls;
}

/**
 * URL do Unsplash (o seed de demonstração) passa reto — só o que apontava pro
 * disco da VPS precisa virar endereço do Storage.
 */
function novaUrl(original: string | null, urls: Map<string, string>): string | null {
  if (!original) return null;
  if (!original.startsWith('/uploads/')) return original;
  return urls.get(basename(original)) ?? null;
}

function mime(nome: string): string {
  const ext = nome.toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

main().catch((e: Error) => {
  console.error(`\n✖ ${e.message}`);
  process.exit(1);
});
