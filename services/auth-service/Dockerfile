FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY services/auth-service ./services/auth-service
RUN pnpm install --frozen-lockfile=false --filter @lac-lac/shared-types --filter auth-service

FROM deps AS build
RUN pnpm --filter @lac-lac/shared-types build
RUN pnpm --filter auth-service build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
EXPOSE 3001
CMD ["pnpm", "--filter", "auth-service", "start"]
