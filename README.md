# Cardápio Digital — API

Backend do cardápio digital multi-tenant: **NestJS com adapter Fastify**.
Frontend em [cardapio-digital-front](https://github.com/cgucoelho/cardapio-digital-front).

No ar em `https://cardapiodigital.capsoftware.com.br/api`.

---

## Rodando

Precisa de Node 18+ (na VPS o Node do sistema é v12; o 20 fica em `/opt/node20`)
e de um projeto Supabase:

```bash
export PATH=/opt/node20/bin:$PATH
npm install
cp .env.example .env      # preencha URL + service_role + anon key
npm run start:dev         # http://localhost:3000
```

A API **não sobe sem Supabase** — é proposital. Até a virada multi-tenant existia
um modo local (itens em `.data/items.json`, fotos em `uploads/`) que servia pra
demo rodar sem credencial; ele foi aposentado porque nunca teria login nem RLS, e
manter os dois caminhos dobrava cada mudança. Uma API que caísse silenciosamente
nesse modo serviria cardápio vazio pro cliente na mesa.

### Preparando o projeto Supabase

1. Crie o projeto em [supabase.com](https://supabase.com).
2. Rode `supabase/schema.sql` no SQL Editor — cria `tenants`, `tenant_users`,
   `items`, o bucket público `menu-items` e as policies de RLS.
3. Copie de **Settings > API** pro `.env`: a URL, a `service_role` (só servidor)
   e a `anon` (pública, vai pro browser).
4. Crie o primeiro estabelecimento:

```bash
npx ts-node scripts/criar-tenant.ts \
  --slug cafe-da-esquina --nome "Café da Esquina" --email dono@cafe.com.br
```

---

## Multi-tenant: como o tenant é resolvido

Duas portas, e o tenant vem de um lugar diferente em cada uma:

| Porta                 | Quem usa       | De onde sai o tenant             |
| --------------------- | -------------- | -------------------------------- |
| `/public/:slug/*`     | cliente na mesa| do **slug na URL**, sem login    |
| `/items`, `/upload`, `/ai/*`, `/me` | lojista | do **token** do Supabase Auth   |

O `AuthGuard` confere o token no Supabase, busca em `tenant_users` os
estabelecimentos daquela conta e pendura o escolhido no request. O cabeçalho
opcional `X-Tenant-Id` só serve pra quem administra mais de um cardápio — e ele
é **conferido contra a lista da conta**, nunca aceito como veio.

⚠️ A API roda com a `service_role`, que **ignora a RLS**. Não existe rede de
segurança embaixo do repositório: por isso `tenantId` é o primeiro parâmetro de
todo método de `ItemsRepository`, inclusive nos que já recebem o id do item.
Buscar só por id parece bastar — o id é um uuid — mas bastaria um id vazado pra
um cliente editar o item do outro. As policies do `schema.sql` são defesa em
profundidade, pro dia em que o browser falar direto com o Supabase.

---

## Endpoints

Público (sem token):

| Método | Rota                        | Descrição                                  |
| ------ | --------------------------- | ------------------------------------------ |
| GET    | `/public/config`            | URL + anon key do Supabase e tenant padrão |
| GET    | `/public/:slug`             | Dados do estabelecimento (nome, cor, …)    |
| GET    | `/public/:slug/items`       | Cardápio da vitrine                        |

Autenticado (`Authorization: Bearer <token do Supabase>`):

| Método | Rota                | Descrição                                      |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/me`               | Quem entrou e quais cardápios administra        |
| PUT    | `/tenant`           | Edita as configs da própria loja (delivery, marca) |
| GET    | `/items?category=`  | Lista itens do tenant; filtro por categoria     |
| GET    | `/items/:id`        | Um item                                         |
| POST   | `/items`            | Cria (201)                                      |
| PUT    | `/items/:id`        | Atualiza (aceita payload parcial)               |
| DELETE | `/items/:id`        | Remove (204)                                    |
| PATCH  | `/items/:id/toggle` | Alterna disponível/esgotado                     |
| POST   | `/upload`           | `multipart/form-data`, campo `file` → `{ url }` |
| POST   | `/ai/describe`      | Gera descrição do item (Gemini)                 |
| POST   | `/ai/enhance-image` | Melhora a foto (Gemini)                         |

A API responde em camelCase (`imageUrl`), o banco guarda em snake_case.

O tenant carrega as configs de delivery (Escopo A): `delivery_fee`, `min_order`,
`accepts_delivery`, `accepts_pickup` — editáveis pelo lojista via `PUT /tenant`,
lidas pela vitrine no checkout que monta o pedido de WhatsApp.

Validação: nome obrigatório (até 80 caracteres), preço numérico maior que zero,
categoria dentro de `Bebidas | Doces | Salgados | Refeições | Outros`, upload só
aceita imagem até 5 MB.

As fotos vão pro bucket `menu-items` numa pasta por tenant
(`menu-items/{tenant_id}/{arquivo}`) — bucket por cliente esbarraria no limite
do projeto e pediria política nova a cada onboarding.

---

## Scripts de manutenção

```bash
# Loja nova (cria o tenant e o login do dono; --senha opcional, senão sorteia)
npx ts-node scripts/criar-tenant.ts --slug padaria --nome "Padaria" --email dono@x.com

# Traz um cardápio do modo local antigo pra dentro de um tenant
npx ts-node scripts/migrar-para-supabase.ts \
  --slug cafe-da-esquina --dados /tmp/items.json --fotos /tmp/uploads
```

Os dois leem o `.env` daqui. `criar-tenant.ts` é idempotente por slug; o de
migração se recusa a rodar num tenant que já tem itens (a menos que você passe
`--substituir`), pra não duplicar o cardápio inteiro num clique repetido.

---

## Docker

```bash
docker build -t cardapio-api:latest .
```

Roda como usuário `node`, sem volume nenhum (nada é gravado em disco), com
healthcheck em `GET /public/config` — a única rota que responde 200 sem token.

Em produção o Traefik remove o prefixo: `/api/items` chega aqui como `/items`.
O `stack.yml` fica em `/opt/cardapio-digital/` na VPS, fora deste repo (é
compartilhado com o front).

## Deploy automático

Push na `main` dispara `.github/workflows/deploy.yml`: entra por SSH na VPS como
`deploy`, faz `git pull`, builda `cardapio-api:latest` e roda
`/opt/cardapio-digital/deploy.sh api` — que recria **só** o serviço da API.

Secrets do repo: `VPS_HOST` e `VPS_SSH_KEY`.
