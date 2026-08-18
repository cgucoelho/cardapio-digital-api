# Cardápio Digital — API

Backend do MVP de cardápio digital para cafeteria: **NestJS com adapter Fastify**.
Frontend em [cardapio-digital-front](https://github.com/cgucoelho/cardapio-digital-front).

No ar em `https://cardapiodigital.capsoftware.com.br/api`.

---

## Rodando

Precisa de Node 18+ (na VPS o Node do sistema é v12; o 20 fica em `/opt/node20`):

```bash
export PATH=/opt/node20/bin:$PATH
npm install
npm run start:dev     # http://localhost:3000
```

O log do boot diz qual persistência está ativa.

## Os dois modos de persistência

Sobe em **modo local** por padrão: itens em `.data/items.json`, fotos em
`uploads/` (servidas em `/uploads`). É o que faz a demo rodar sem depender de
credencial nenhuma — já com os **6 itens de exemplo** carregados.

Com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`, a mesma API passa a
usar **Supabase (PostgreSQL + Storage)** sem mudar uma linha do frontend: os dois
modos implementam o mesmo contrato (`ItemsRepository` e `StorageService`).

### Ligando o Supabase

1. `.env` (copie de `.env.example`):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...      # Settings > API > service_role
   SUPABASE_BUCKET=menu-items
   ```
2. Rode `supabase/schema.sql` no SQL Editor do projeto — cria a tabela `items`,
   o bucket público `menu-items` e insere os mesmos 6 itens de demonstração.
3. Reinicie a API.

A `service_role` key só é usada no servidor; nunca vai pro browser.

---

## Endpoints

| Método | Rota                | Descrição                                      |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/items?category=`  | Lista itens; filtro opcional por categoria      |
| GET    | `/items/:id`        | Um item                                         |
| POST   | `/items`            | Cria (201)                                      |
| PUT    | `/items/:id`        | Atualiza (aceita payload parcial)               |
| DELETE | `/items/:id`        | Remove (204)                                    |
| POST   | `/upload`           | `multipart/form-data`, campo `file` → `{ url }` |

Tabela `items`: `id`, `name`, `description`, `price`, `category`, `image_url`,
`available`, `created_at`. A API responde em camelCase (`imageUrl`), o banco
guarda em snake_case.

Validação: nome obrigatório (até 80 caracteres), preço numérico maior que zero,
categoria dentro de `Bebidas | Doces | Salgados | Outros`, upload só aceita
imagem até 5 MB.

---

## Docker

```bash
docker build -t cardapio-api:latest .
```

Roda como usuário `node`, com healthcheck em `GET /items`. Em produção os
caminhos `/app/.data` e `/app/uploads` são volumes do Swarm — o `stack.yml` fica
em `/opt/cardapio-digital/` na VPS, fora deste repo (é compartilhado com o
front).

Em produção o Traefik remove o prefixo: `/api/items` chega aqui como `/items`.

## Deploy automático

Push na `main` dispara `.github/workflows/deploy.yml`: entra por SSH na VPS como
`deploy`, faz `git pull`, builda `cardapio-api:latest` e roda
`/opt/cardapio-digital/deploy.sh api` — que recria **só** o serviço da API.

Secrets do repo: `VPS_HOST` e `VPS_SSH_KEY`.
