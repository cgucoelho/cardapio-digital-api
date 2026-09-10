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

# Nada é gravado em disco: itens vão pro Postgres do Supabase e fotos pro
# Storage. Container sem volume nenhum desde a virada multi-tenant.
USER node
EXPOSE 3000

# /public/config é a única rota que responde 200 sem token e sem tocar no
# banco — /items agora exige login e devolveria 401 pro healthcheck.
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/public/config').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
