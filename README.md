# Lắc Lắc

Lắc một cái — biết ngay ăn gì!

Monorepo đa nền tảng cho ứng dụng Lắc Lắc, tập trung vào trải nghiệm chọn món nhanh (shake + swipe) và thu thập dữ liệu hành vi để chuẩn bị cho recommendation AI ở v3.

## Định hướng v1

- Không dùng GPS, bản đồ hoặc định vị người dùng.
- Không dùng AI recommendation ở v1.
- Có đầy đủ dữ liệu thô user_actions để phục vụ AI ở v3.
- Thương hiệu Lắc Lắc được dùng thống nhất ở các phần hiển thị.

## Kiến trúc

- Monorepo: Turborepo + pnpm
- Pattern: Clean Architecture, microservices-ready
- Backend services: NestJS 10 + MongoDB + Redis + BullMQ
- Frontend:
  - Mobile: React Native + Expo Router
  - Web: Next.js 14 App Router
  - Admin: Next.js 14

```
lac-lac/
├── apps/
│   ├── mobile/
│   ├── web/
│   └── admin/
├── services/
│   ├── auth-service/
│   ├── food-service/
│   ├── action-service/
│   ├── rec-service/
│   └── media-service/
├── packages/
│   ├── shared-types/
│   ├── ui-kit/
│   └── api-client/
├── infra/
│   ├── docker-compose.yml
│   └── nginx.conf
└── postman/
		└── lac-lac.postman_collection.json
```

## Tính năng đã scaffold

- auth-service:
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
  - GET /auth/me
- food-service:
  - GET /foods, GET /foods/:id
  - GET /foods/random
  - GET /foods/swipe-queue
  - POST /foods/filter
  - POST /foods/context (rule-based)
  - POST/PUT/DELETE /foods (admin)
  - GET /categories
- action-service:
  - POST /actions (async via BullMQ)
  - POST/GET/DELETE /favorites
  - POST/GET /reviews
  - PUT /users/me/profile
  - Cron mỗi 1 giờ tính popularityScore theo trọng số
- rec-service:
  - GET /recommendations (placeholder trả [])
  - GET /recommendations/trending
- media-service:
  - POST /media/upload (Cloudinary hoặc mock fallback)
- Seed dữ liệu:
  - services/food-service/src/seeds/seed-foods.ts
  - 60 món Việt theo danh sách yêu cầu

## Yêu cầu môi trường

- Node.js 20 LTS
- pnpm 9 (qua corepack)
- Docker + Docker Compose
- MongoDB 7, Redis 7 (nếu chạy local không Docker)

## Thiết lập

1. Cài dependency

```bash
corepack enable
corepack pnpm install
```

2. Tạo file môi trường

```bash
cp .env.example .env
```

3. Cập nhật giá trị trong .env

- MONGODB_URI
- REDIS_URL
- JWT_SECRET / JWT_REFRESH_SECRET
- CLOUDINARY\_\* (nếu dùng upload thật)

## Chạy bằng Docker

```bash
cd infra
docker compose up --build
```

Gateway Nginx (mặc định khi chạy Docker): http://localhost:3100

Nếu máy bạn không bị chặn cổng 3000 và muốn dùng lại 3000, đặt `GATEWAY_PORT=3000` trước khi `docker compose up` hoặc chạy với `--env-file ../.env`.

## Chạy local từng phần

Backend services:

```bash
corepack pnpm --filter auth-service dev
corepack pnpm --filter food-service dev
corepack pnpm --filter action-service dev
corepack pnpm --filter rec-service dev
corepack pnpm --filter media-service dev
```

Apps:

```bash
corepack pnpm --filter mobile-app start
corepack pnpm --filter web-app dev
corepack pnpm --filter admin-app dev
```

## Seed dữ liệu 89 món

```bash
corepack pnpm --filter food-service seed
```

## Swagger Docs

Khi chạy local từng service (không qua Docker gateway):

- Auth: http://localhost:3001/api/docs/auth
- Food: http://localhost:3002/api/docs/food
- Action: http://localhost:3003/api/docs/action
- Recommendation: http://localhost:3004/api/docs/recommendations
- Media: http://localhost:3005/api/docs/media

Khi chạy Docker theo `infra/docker-compose.yml`, Nginx mặc định chỉ route nhóm API `/api/v1/*`.
Route `/api/docs/*` chưa được expose qua gateway.

## Postman

Import file:

- postman/lac-lac.postman_collection.json

## Build nhanh

```bash
corepack pnpm --filter @lac-lac/shared-types build
corepack pnpm --filter auth-service build
corepack pnpm --filter food-service build
corepack pnpm --filter action-service build
corepack pnpm --filter rec-service build
corepack pnpm --filter media-service build
```

## Lưu ý kỹ thuật

- API response format thống nhất: { success, data, message?, meta? }
- Action logging không chặn UI (queue BullMQ)
- user_actions giữ raw data, không xóa, không aggregate ghi đè
- popularityScore = swipe_right*2 + view_detail*1 + favorite_add*3 + review_submit*4
