/**
 * Onboarding de um estabelecimento novo — enquanto não existe cadastro
 * self-service, é este script que cria a loja e o login do dono.
 *
 *   npx ts-node scripts/criar-tenant.ts \
 *     --slug padaria-do-bairro --nome "Padaria do Bairro" \
 *     --email dono@padaria.com
 *
 * Opcionais: --senha, --cor "#2C1D16", --tagline "desde 2019", --whatsapp,
 * --wifi (nome da rede, aparece no rodapé da vitrine).
 *
 * Rodar de novo com o mesmo slug atualiza o nome/cor e religa o e-mail, sem
 * duplicar nada. A senha, se não vier, é sorteada e impressa no fim.
 */
import { randomBytes } from 'crypto';

import { admin, arg, validarSlug } from './supabase-admin';

async function main(): Promise<void> {
  const slug = arg('slug');
  const nome = arg('nome');
  const email = arg('email');

  if (!slug || !nome) {
    throw new Error('Uso: --slug <slug> --nome "<Nome>" [--email <e-mail do dono>]');
  }
  validarSlug(slug);

  const db = admin();

  const { data: tenant, error: erroTenant } = await db
    .from('tenants')
    .upsert(
      {
        slug,
        name: nome,
        tagline: arg('tagline') ?? null,
        brand_color: arg('cor') ?? '#2C1D16',
        whatsapp: arg('whatsapp') ?? null,
        wifi: arg('wifi') ?? null,
        active: true,
      },
      { onConflict: 'slug' },
    )
    .select('id, slug, name')
    .single();

  if (erroTenant) throw new Error(`Falha ao criar o tenant: ${erroTenant.message}`);
  console.log(`✔ Tenant ${tenant.name} (${tenant.slug}) — id ${tenant.id}`);

  if (!email) {
    console.log('Nenhum --email: a loja ficou sem login. Rode de novo com --email pra ligar o dono.');
    return;
  }

  const senha = arg('senha') ?? randomBytes(9).toString('base64url');
  const userId = await garantirUsuario(db, email, senha);

  const { error: erroVinculo } = await db
    .from('tenant_users')
    .upsert({ tenant_id: tenant.id, user_id: userId, role: 'owner' });

  if (erroVinculo) throw new Error(`Falha ao ligar o usuário ao tenant: ${erroVinculo.message}`);

  console.log(`✔ ${email} agora administra ${tenant.slug}`);
  if (!arg('senha')) console.log(`  Senha gerada: ${senha}  (peça pro dono trocar no primeiro acesso)`);
  console.log(`\nVitrine:  /c/${tenant.slug}\nAdmin:    /login`);
}

/** Cria o usuário no Supabase Auth, ou devolve o id de quem já existe. */
async function garantirUsuario(
  db: ReturnType<typeof admin>,
  email: string,
  senha: string,
): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: senha,
    // Sem SMTP configurado no projeto, esperar confirmação por e-mail deixaria
    // o dono sem conseguir entrar. A conta já nasce confirmada.
    email_confirm: true,
  });

  if (!error && data.user) return data.user.id;

  // createUser não distingue bem "já existe" por código; a busca resolve.
  const existente = await procurarPorEmail(db, email);
  if (existente) {
    console.log(`• ${email} já tinha conta — mantida a senha atual.`);
    return existente;
  }

  throw new Error(`Falha ao criar o usuário: ${error?.message ?? 'motivo desconhecido'}`);
}

async function procurarPorEmail(
  db: ReturnType<typeof admin>,
  email: string,
): Promise<string | null> {
  const alvo = email.toLowerCase();

  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);

    // O tipo de `data` é uma união que deixa `users` como never na interseção.
    const usuarios = data.users as { id: string; email?: string }[];

    const achado = usuarios.find((u) => u.email?.toLowerCase() === alvo);
    if (achado) return achado.id;
    if (usuarios.length < 200) return null;
  }
  return null;
}

main().catch((e: Error) => {
  console.error(`\n✖ ${e.message}`);
  process.exit(1);
});
