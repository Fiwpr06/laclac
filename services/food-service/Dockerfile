FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY services/food-service ./services/food-service
RUN pnpm install --frozen-lockfile --filter @lac-lac/shared-types --filter food-service

FROM deps AS build
RUN pnpm --filter @lac-lac/shared-types build
RUN pnpm --filter food-service build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
EXPOSE 3002
CMD ["pnpm", "--filter", "food-service", "start"]
