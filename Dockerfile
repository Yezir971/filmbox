# syntax=docker/dockerfile:1

# =======================================================
# 1. Étape Base
# =======================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# =======================================================
# 2. Étape Dépendances
# =======================================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# =======================================================
# 3. Étape Build
# =======================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# =======================================================
# 4. Étape Runner (Exécution Minimale)
# =======================================================
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie des fichiers statiques et assets publics
COPY --from=builder /app/public ./public

# Création du cache avec permissions appropriées
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copie de l'artefact standalone généré par Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
