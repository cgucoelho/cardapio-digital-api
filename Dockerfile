# Build em duas etapas: a imagem final não leva devDependencies nem fonte TS.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npx nest build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production TZ=America/Sao_Paulo PORT=3000
RUN apk add --no-cache tzdata
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist

# Os volumes montados herdam dono/permissão destes caminhos quando são criados
# vazios. Sem o chown, o container (que roda como `node`) não escreveria neles.
# Só são usados no modo local; com Supabase configurado ficam vazios.
RUN mkdir -p /app/.data /app/uploads && chown -R node:node /app/.data /app/uploads

USER node
EXPOSE 3000

# GET /items responde nos dois modos de persistência.
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/items').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
