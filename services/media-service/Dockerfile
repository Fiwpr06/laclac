FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY services/media-service ./services/media-service
RUN pnpm install --frozen-lockfile=false --filter media-service

FROM deps AS build
RUN pnpm --filter media-service build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
EXPOSE 3005
CMD ["pnpm", "--filter", "media-service", "start"]
