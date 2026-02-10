FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS development-dependencies-env
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm fetch
COPY package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM base AS production-dependencies-env
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm fetch --prod
COPY package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

FROM base AS build-env
WORKDIR /app
COPY --from=development-dependencies-env /app/node_modules ./node_modules
COPY . ./
RUN pnpm build

FROM base
WORKDIR /app
COPY package.json ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build
COPY --from=build-env /app/instrument.server.mjs ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm prisma generate
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
