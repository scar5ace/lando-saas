FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PRISMA_ENGINES_MIRROR=https://r2.prisma.sh
ARG BUILD_APP_NAME=Lando
ARG BUILD_APP_URL=http://localhost:3000
ARG BUILD_PLATFORM_ROOT_DOMAIN=localhost
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY certs/*.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS tools
COPY . .
# The generated Prisma client is committed to the repository. Reusing it keeps
# local development builds functional when Docker DNS cannot reach r2.prisma.sh.
RUN test -f src/generated/prisma/client.ts
CMD ["npm", "run", "db:deploy"]

FROM tools AS development
ENV NODE_ENV=development \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN mkdir -p public/uploads
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/ready').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["sh", "-ec", "if [ \"$NODE_ENV\" != development ]; then echo 'development image requires NODE_ENV=development' >&2; exit 1; fi; exec npm run dev -- --hostname 0.0.0.0"]

FROM deps AS builder
ARG BUILD_APP_NAME
ARG BUILD_APP_URL
ARG BUILD_PLATFORM_ROOT_DOMAIN
COPY . .
RUN mkdir -p public \
    && DATABASE_URL=postgresql://lando:build@127.0.0.1:5432/lando npm run db:generate
# Next embeds the public build arguments in static metadata/robots. The
# remaining values below are intentionally non-secret server placeholders.
RUN NODE_ENV=production \
    APP_NAME="$BUILD_APP_NAME" \
    APP_URL="$BUILD_APP_URL" \
    PLATFORM_ROOT_DOMAIN="$BUILD_PLATFORM_ROOT_DOMAIN" \
    DATABASE_URL=postgresql://lando:build@127.0.0.1:5432/lando \
    AUTH_SECRET=build-only-placeholder-not-a-runtime-secret \
    LLM_PROVIDER=mock \
    STORAGE_PROVIDER=local \
    EMAIL_PROVIDER=smtp \
    SMTP_HOST=localhost \
    SMTP_PORT=2525 \
    EMAIL_FROM=build@example.com \
    BILLING_PROVIDER=mock \
    REGRU_API_ENABLED=false \
    npm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/ready').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["sh", "-ec", "if [ \"$NODE_ENV\" != production ]; then echo 'runner image requires NODE_ENV=production' >&2; exit 1; fi; exec node server.js"]
