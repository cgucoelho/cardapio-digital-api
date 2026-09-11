-- =====================================================================
-- Cardápio Digital — schema multi-tenant
-- Rode este arquivo no SQL Editor do Supabase (projeto novo, uma vez).
--
-- Escrito para um projeto VAZIO. Se a tabela `items` já existir sem
-- `tenant_id` (schema antigo do MVP), não rode isto por cima: crie um projeto
-- novo e traga os dados com scripts/migrar-para-supabase.ts.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenants — um por estabelecimento
-- ---------------------------------------------------------------------
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  -- O slug é a URL pública (/c/cafe-da-esquina). Só minúsculas, números e
  -- hífen no meio: é o que o Angular vai jogar na rota sem escapar nada.
  slug        text not null unique
              check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' and length(slug) between 3 and 40),
  name        text not null,
  -- Linha fina acima do nome na vitrine ("desde 2019 · torra própria").
  tagline     text,
  logo_url    text,
  -- Cor do cabeçalho da vitrine. O default é o espresso-800 do Tailwind: um
  -- cardápio criado sem escolher cor sai igualzinho ao layout original.
  brand_color text not null default '#2C1D16',
  whatsapp    text,
  -- Rodapé da vitrine ("Wi-Fi: cafe-esquina"). Vazio = some o rodapé.
  wifi        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Quem pode administrar qual tenant
-- ---------------------------------------------------------------------
-- Um usuário do Supabase Auth pode administrar mais de um estabelecimento
-- (rede com duas lojas), e um estabelecimento pode ter mais de um usuário.
create table if not exists public.tenant_users (
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_users_user_idx on public.tenant_users (user_id);

-- ---------------------------------------------------------------------
-- 3. Itens do cardápio
-- ---------------------------------------------------------------------
-- ⚠️ A lista de categorias tem três cópias que precisam andar juntas: o check
-- abaixo, api/src/items/item.types.ts e web/src/app/core/item.model.ts.
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10, 2) not null check (price > 0),
  category    text not null
              check (category in ('Bebidas', 'Doces', 'Salgados', 'Refeições', 'Outros')),
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Toda consulta do produto filtra por tenant; o índice composto cobre tanto a
-- listagem inteira quanto o filtro por categoria.
create index if not exists items_tenant_category_idx on public.items (tenant_id, category);
create index if not exists items_tenant_created_idx on public.items (tenant_id, created_at);

-- ---------------------------------------------------------------------
-- 4. Storage: bucket público das fotos
-- ---------------------------------------------------------------------
-- Um bucket só, com uma pasta por tenant: menu-items/{tenant_id}/{arquivo}.
-- Bucket por cliente não escala (política e limite por bucket) e a separação
-- por pasta é o que as policies de storage lá embaixo sabem ler.
insert into storage.buckets (id, name, public)
values ('menu-items', 'menu-items', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
-- A API é o único caminho de leitura E escrita, e usa a service_role, que
-- ignora RLS. O browser só fala com o Supabase pra autenticar.
--
-- Por isso NÃO existe policy de leitura pública aqui: com uma, qualquer um de
-- posse da anon key (que é pública por design, vai no browser) listaria a
-- tabela `tenants` inteira — o nome e o WhatsApp de cada estabelecimento
-- cliente. Sem ela, a RLS nega por padrão e a anon key serve só pra login.
-- Se um dia o front for ler direto do Supabase, a policy de leitura volta —
-- de preferência restrita, não aberta como era.

-- Pertencimento em SQL, pra não repetir o subselect em cada policy.
-- security definer: a própria checagem não pode esbarrar na RLS de
-- tenant_users, senão vira recursão.
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = t and tu.user_id = auth.uid()
  );
$$;

alter table public.tenants      enable row level security;
alter table public.tenant_users enable row level security;
alter table public.items        enable row level security;

drop policy if exists tenants_member_update on public.tenants;
create policy tenants_member_update on public.tenants
  for update using (public.is_tenant_member(id)) with check (public.is_tenant_member(id));

drop policy if exists tenant_users_self_read on public.tenant_users;
create policy tenant_users_self_read on public.tenant_users
  for select using (user_id = auth.uid());

-- Quem é do tenant faz tudo dentro do próprio tenant. A vitrine do cliente
-- final não aparece aqui porque não passa por RLS: ela é servida pela API em
-- /public/:slug/items, que filtra por tenant no repositório.
drop policy if exists items_member_all on public.items;
create policy items_member_all on public.items
  for all using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- Storage: leitura é pública (o bucket é público), então só a escrita tem
-- policy. O caminho é {tenant_id}/{arquivo}; esta função devolve o tenant_id
-- ou null quando a pasta não é um uuid — o cast direto estouraria a query
-- inteira em vez de só negar o acesso.
create or replace function public.tenant_da_pasta(caminho text)
returns uuid
language sql
immutable
as $$
  select nullif((string_to_array(caminho, '/'))[1], '')::uuid
  where (string_to_array(caminho, '/'))[1]
        ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

drop policy if exists menu_items_member_write on storage.objects;
create policy menu_items_member_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'menu-items'
    and public.is_tenant_member(public.tenant_da_pasta(name))
  ) with check (
    bucket_id = 'menu-items'
    and public.is_tenant_member(public.tenant_da_pasta(name))
  );
