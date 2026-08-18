-- =====================================================================
-- Cardápio Digital — MVP
-- Rode este arquivo no SQL Editor do Supabase (uma vez por projeto).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela de itens
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  price       numeric(10, 2) not null check (price > 0),
  category    text        not null check (category in ('Bebidas', 'Doces', 'Salgados', 'Outros')),
  image_url   text,
  available   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists items_category_idx on public.items (category);
create index if not exists items_created_at_idx on public.items (created_at desc);

-- ---------------------------------------------------------------------
-- 2. Storage: bucket público das fotos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-items', 'menu-items', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------
-- 3. Segurança (MVP)
-- ---------------------------------------------------------------------
-- Sem RLS nesta fase: a API roda com a SERVICE_ROLE key no servidor e é o
-- único caminho de escrita. RLS + multi-tenant entram na fase SaaS.
alter table public.items disable row level security;

-- ---------------------------------------------------------------------
-- 4. Seed de demonstração
-- ---------------------------------------------------------------------
-- Idempotente: limpa os itens de exemplo antes de reinserir.
delete from public.items where name in (
  'Espresso Duplo',
  'Cappuccino Cremoso',
  'Cheesecake de Frutas Vermelhas',
  'Cookie Duplo Chocolate',
  'Croissant de Presunto e Queijo',
  'Granola com Iogurte e Mel'
);

insert into public.items (name, description, price, category, image_url, available) values
  ('Espresso Duplo',
   'Dose dupla de grãos torrados na casa, corpo intenso e crema aveludada.',
   8.50, 'Bebidas',
   'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80', true),

  ('Cappuccino Cremoso',
   'Espresso, leite vaporizado e uma nuvem de espuma com canela.',
   12.00, 'Bebidas',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', true),

  ('Cheesecake de Frutas Vermelhas',
   'Base crocante, creme suave e calda artesanal de frutas da estação.',
   16.00, 'Doces',
   'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80', true),

  ('Cookie Duplo Chocolate',
   'Assado toda manhã, macio por dentro, com gotas de chocolate meio amargo.',
   9.00, 'Doces',
   'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80', false),

  ('Croissant de Presunto e Queijo',
   'Massa folhada amanteigada, presunto cru e queijo gratinado.',
   13.50, 'Salgados',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80', true),

  ('Granola com Iogurte e Mel',
   'Iogurte natural, granola artesanal, mel e frutas frescas.',
   14.00, 'Outros',
   'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', true);
