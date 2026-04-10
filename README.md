# Lắc Lắc - "Lắc một cái, ra món ngay"

Lắc Lắc là một hệ sinh thái ứng dụng (Web, Mobile, Admin) giúp định hướng người dùng giải quyết bài toán "Hôm nay ăn gì?" một cách nhanh chóng và tự nhiên. Dành cho những ai phải đau đầu tranh luận hay cân nhắc để chọn món ăn mỗi ngày, dự án mang đến trải nghiệm "Lắc" (Shake) trực quan cùng thao tác "Quẹt" (Swipe) thẻ để ngay lập tức đề xuất món ăn phù hợp theo ngân sách, loại bữa và khẩu vị mà không cần thao tác dườm rà.

Mục tiêu dài hạn là xây dựng thói quen người dùng ở bản v1 và sử dụng AI để cá nhân hóa hoàn toàn đề xuất món ăn ở bản v3.

## Định hướng v1

- **Không dùng GPS hay bản đồ:** Giữ cho flow đơn giản, người dùng chỉ cần filter món ăn mà không bị làm phiền bởi các yếu tố vị trí.
- **Microservices & Monorepo:** Tận dụng công nghệ hiện đại giúp đảm bảo tính linh hoạt, tái sử dụng cao và độ ổn định khi mở rộng.
- **Không AI Recommendation v1:** Thay vì tích hợp AI sớm, hệ thống tập trung hoàn thiện core (logic Backend, thiết kế Mobile, Web mượt mà) và ghi nhận toàn bộ "user actions" làm dữ liệu gốc phục vụ cho model AI sau này.
- **Thương hiệu Lắc Lắc:** Hệ thống nhận diện xuyên suốt từ website, mobile app tới dashboard của ban quản trị.

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

## Dev nhanh (chỉ hạ tầng)

Chạy MongoDB + Redis bằng Docker, còn services/apps chạy local để hot-reload nhanh:

```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

## Chạy local từng phần

Backend services (khởi chạy toàn bộ services cùng lúc):

```bash
corepack pnpm turbo run dev --filter=auth-service --filter=food-service --filter=action-service --filter=rec-service --filter=media-service
```

Hoặc chạy lẻ từng service:

```bash
corepack pnpm --filter auth-service dev
corepack pnpm --filter food-service dev
corepack pnpm --filter action-service dev
```

Apps:

```bash
corepack pnpm --filter mobile-app dev
corepack pnpm --filter web-app dev
corepack pnpm --filter admin-app dev
```

Chạy nhanh mobile + APIs cần thiết (khuyến nghị để tránh lag do thiếu service):

```bash
corepack pnpm dev:mobile
```

Chạy nhanh web + APIs cần thiết:

```bash
corepack pnpm dev:web
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

## License

Copyright (c) 2024 Lắc Lắc. All rights reserved.

This source code is licensed under a proprietary license. You may not copy, modify, distribute, or use this code without explicit permission from the author(s).
