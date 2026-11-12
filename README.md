<div align="center">

# ⚙️ Amar Shop API — Multi-Vendor E-Commerce Backend

**High-performance, type-safe RESTful API engine powering the Amar Shop multi-vendor marketplace.**  
Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL. Features role-based access control (RBAC), zero-trust payment calculations, SSLCommerz gateway integration, and multi-tenant analytical telemetry.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[🔌 Live API Base URL](https://amar-shop-server-gules.vercel.app/api) • [🌐 Frontend Client](https://amar-shop-client.vercel.app)

</div>

---

## 📋 Table of Contents
- [✨ Key Architectural Features](#-key-architectural-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Local Setup & Installation](#-local-setup--installation)
- [🔐 Environment Variables](#-environment-variables)
- [📡 API Documentation](#-api-documentation)
- [📁 Folder Structure](#-folder-structure)
- [📜 Available Scripts](#-available-scripts)
- [📄 License](#-license)
- [👤 Author](#-author)

---

## ✨ Key Architectural Features

* **🛡️ Zero-Trust Price Recalculation:** Client-submitted cart totals are strictly ignored; item prices, 5% VAT, shipping, and coupon percentages are recalculated against database records to prevent client payload manipulation.
* **🔒 Database Lock Decoupling:** Third-party payment gateway I/O (SSLCommerz) is executed outside database transactions to prevent connection starvation under high concurrency.
* **🧠 Proximity Recommendation Service:** Computes mathematical price proximity (`Math.abs(price - targetPrice)`) within category clusters for accurate, real-time product discovery.
* **👥 Role-Based Access Control (RBAC):** Granular middleware protecting sensitive routes across `ADMIN`, `VENDOR`, and `CUSTOMER` roles with JWT access and refresh token rotation.
* **📊 Role-Specific Telemetry:** Dedicated aggregation services for gross revenue, 12-month revenue trend curves, store health, and buyer delivery tracking.

---

## 🛠️ Tech Stack

* **Runtime & Language:** Node.js (v18+), TypeScript
* **Framework:** Express.js
* **Database & ORM:** PostgreSQL (Neon / Supabase), Prisma ORM
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcrypt` password hashing, `cookie-parser`
* **File Storage:** Cloudinary, Multer
* **Validation:** Zod Schema Validation
* **Payment Gateway:** SSLCommerz Payment Gateway

---

## ⚙️ Prerequisites

* **Node.js**: `v18.0.0` or higher
* **PostgreSQL**: PostgreSQL 14+ database instance
* **Cloudinary Account**: Cloud name, API key, and secret

---

## 🚀 Local Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/Utsho11/amar-shop-server.git
cd amar-shop-server

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env

# 4. Generate Prisma client & sync database
npx prisma generate
npx prisma db push

# 5. Start development server with hot-reload
npm run dev
```

Server runs by default at `http://localhost:5000`.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/amar_shop_db?schema=public"

# JWT Secrets
ACCESS_SECRET="your_access_secret_key"
REFRESH_SECRET="your_refresh_secret_key"
ACCESS_SECRET_EXPIRE=1d
REFRESH_SECRET_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# SSLCommerz Payment Gateway
STORE_ID="your_sslcommerz_store_id"
STORE_PASS="your_sslcommerz_store_password"
IS_LIVE=false
SUCCESS_URL="http://localhost:5000/api/payment/success"
FAIL_URL="http://localhost:5000/api/payment/fail"
CANCEL_URL="http://localhost:5000/api/payment/cancel"
```

---

## 📡 API Documentation

### 🔑 Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new customer or vendor account.
* `POST /api/auth/login` — Authenticate and receive access token & HTTP-only refresh token.
* `POST /api/auth/refresh-token` — Rotate and obtain a new access token.
* `POST /api/auth/change-password` — Update user password *(Requires Auth)*.

### 🛍️ Products (`/api/product`)
* `GET /api/product` — Query catalog with search, price filtering, sorting, and pagination.
* `GET /api/product/:id` — Retrieve product details and specifications.
* `GET /api/product/recommendations/:id` — Get proximity-ranked related products.
* `POST /api/product/create-product` — Create product listing *(Vendor)*.
* `PATCH /api/product/:id` — Update product details or stock *(Vendor/Admin)*.
* `DELETE /api/product/:id` — Delete product *(Vendor/Admin)*.

### 💳 Checkout & Customer (`/api/customer`)
* `POST /api/customer/checkout` — Calculate order total, lock stock, and generate SSLCommerz session.
* `GET /api/customer/myOrderHistory` — Retrieve buyer order history with live delivery stages.
* `POST /api/customer/add-review` — Submit product review and rating *(Customer)*.
* `GET /api/customer/dashboard-stats` — Get buyer spend telemetry and in-transit order counts.

### 📊 Telemetry & Administration
* `GET /api/vendor/dashboard-stats` — Vendor earnings, pending orders, and monthly performance.
* `PATCH /api/vendor/update-order-status/:id` — Transition order fulfillment milestone (`PROCESSING` → `SHIPPED` → `DELIVERED`).
* `GET /api/admin/dashboard-stats` — Platform-wide gross revenue, accounts, and 12-month trend curve.
* `GET /api/admin/viewTransaction` — Searchable financial transaction ledger.

---

## 📁 Folder Structure

```
amar-shop-server/
├── prisma/
│   └── schema.prisma        # Database models & relations
├── src/
│   ├── app/
│   │   ├── middlewares/     # Auth, Zod validation, globalErrorHandler
│   │   ├── modules/
│   │   │   ├── Admin/       # Admin controllers, services, routes
│   │   │   ├── Auth/        # Authentication & password reset logic
│   │   │   ├── Customer/    # Order checkout, reviews, buyer telemetry
│   │   │   ├── Payment/     # SSLCommerz IPN verification & callbacks
│   │   │   ├── User/        # Profile & role management
│   │   │   └── Vendor/      # Storefronts, product listings, vendor stats
│   │   └── routes/          # Unified Express route definitions
│   ├── config/              # Cloudinary, Multer, env configuration
│   ├── shared/              # Prisma client instance & response utilities
│   ├── utils/               # SSLCommerz helpers & database seeders
│   ├── app.ts               # Express application initialization
│   └── server.ts            # HTTP server entry point
└── vercel.json              # Serverless deployment configuration
```

---

## 📜 Available Scripts

* `npm run dev` — Starts development server with live reload (`ts-node-dev`).
* `npm run build` — Compiles TypeScript into `dist/`.
* `npm start` — Runs production server (`node dist/server.js`).

---

## 📄 License

Distributed under the **MIT License**.

---

## 👤 Author

**Utsho** — [@Utsho11](https://github.com/Utsho11)
