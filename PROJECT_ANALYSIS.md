# Comprehensive Architecture & Codebase Audit Report: Amar Shop
**Audit Date:** November 2026  
**Auditor:** Senior Software Architect  
**Scope:** Full-Stack Multi-Vendor E-Commerce Platform (`amar-shop-client` & `amar-shop-server`)  
**Methodology:** Read-Only Static Analysis, Architectural Pattern Evaluation, Security Threat Modeling, and Data Flow Tracing.

---

## 1. PROJECT OVERVIEW

### 1.1 Executive Summary
**Amar Shop** is designed as a multi-vendor e-commerce marketplace platform targeting three distinct user personas: **Customers** (buyers), **Vendors** (merchant boutiques), and **Administrators** (platform governance). The platform provides merchant storefronts, product catalogs, side-by-side product comparisons, shopping carts with single-vendor isolation, payment processing via the SSLCommerz gateway, 4-stage order fulfillment telemetry, customer reviews, and administrative dashboards.

### 1.2 Target Users & Roles
1. **Customer (`CUSTOMER`):** Discovers products, filters catalogs, compares up to 3 products side-by-side, manages a single-boutique cart, applies coupons, completes payments via SSLCommerz, tracks order fulfillment stages (`PLACED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), reviews purchased products, maintains a personal wishlist, and follows boutique shops.
2. **Vendor (`VENDOR`):** Operates merchant boutiques (`/shop/:id`), creates and updates product catalog entries with multi-image Cloudinary uploads, duplicates existing products, transitions customer order fulfillment stages, and tracks merchant revenue/ratings via analytics charts.
3. **Platform Administrator (`ADMIN`):** Oversees platform health, blocks/suspends accounts, blacklists/unblocks vendor boutiques, monitors all financial transaction logs, creates global percentage discount coupons, and monitors platform-wide revenue telemetry.

### 1.3 Reality Check: Existing vs. Claimed Features

| Feature Claimed in README | Actual State in Codebase | File Evidence | Status |
|---|---|---|---|
| **Zero-Trust Server Price Recalculation** | Subtotal and discount recalculated from DB. **However, 5% VAT and $15 shipping fee calculated on client are completely omitted on the server.** | `customer.services.ts#L33-L77` vs `CheckoutPage.tsx#L48-L53` | **Partially Implemented (Discrepancy)** |
| **Zero-Trust Payment Validation** | **Critical bypass:** All validation failure paths and unhandled exceptions default to `isPaymentSuccessful = true`. Endpoints accept arbitrary GET/POST query params. | `payment.services.ts#L44-L65`, `payment.controllers.ts#L4-L17` | **Broken / Simulated (Critical Flaw)** |
| **Side-by-Side Product Comparison** | Floating comparison matrix comparing specs, price, stock, category, and boutique for up to 3 items. | `ComparisonPage.tsx#L1-L262`, `comparisonSlice.ts#L1-L47` | **Fully Implemented** |
| **Content-Based Proximity Recommendations** | Queries DB for products within 50% to 150% price band within the same category, backfilling with top discounted items. | `product.services.ts#L360-L447`, `RecommendedProductsSection.tsx` | **Fully Implemented** |
| **4-Stage Order Tracking Pipeline** | Visual step-tracker rendering `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`. | `OrderTimeline.tsx#L1-L85`, `MyOrders.tsx#L15-L31` | **Fully Implemented** |
| **Live Telemetry & Revenue Charts** | Implemented using Recharts in `AdminProfile.tsx` and `VendorProfile.tsx`. **However, standalone chart components (`RevenueChart.tsx`, `VendorRevenueChart.tsx`, `TotalShopCard.tsx`) are abandoned dead code.** | `AdminProfile.tsx#L186-L220`, `RevenueChart.tsx#L1-L83` | **Implemented with Dead Code Artifacts** |
| **Single-Vendor Cart Isolation** | Prevents cross-vendor items by opening a replacement modal. **Implements anti-pattern: throws raw Error inside Redux reducer.** | `cartSlice.ts#L32-L34`, `ProductDetailsPage.tsx#L148-L171` | **Implemented via Anti-Pattern** |
| **Live Market Metrics** | Displays "500+ Verified Merchants", "12,000+ Items", "45K+ Reviews". | `LiveMarketMetrics.tsx#L8-L41` | **Completely Hardcoded / Fake Data** |
| **Customer Testimonials** | Renders 3 customer feedback cards with names, quotes, and avatars. | `CustomerTestimonials.tsx#L8-L36` | **Completely Hardcoded / Fake Data** |
| **Contact Us Form** | Contact page with full name, email, subject, message form. | `Contact.tsx#L7-L15` | **Stubbed UI (Mock Toast, No API call)** |
| **Global Coupon System** | Admins create coupon code and discount percentage. | `admin.services.ts#L165-L179`, `CreateCoupon.tsx` | **Minimal Stub (No expiry, limits, or deletion)** |

---

## 2. TECH STACK

### 2.1 Technology Matrix

| Layer | Technology | Version | Source Citation |
|---|---|---|---|
| **Frontend Framework** | React | `^18.3.1` | `amar-shop-client/package.json#L16` |
| **Frontend Build Tool** | Vite | `^6.0.1` | `amar-shop-client/package.json#L48` |
| **Language (Frontend)** | TypeScript | `~5.6.2` | `amar-shop-client/package.json#L46` |
| **Styling & Components** | Tailwind CSS | `^3.4.16` | `amar-shop-client/package.json#L45` |
| **UI Component Library** | DaisyUI | `^4.12.14` | `amar-shop-client/package.json#L39` |
| **State Management** | Redux Toolkit | `^2.4.0` | `amar-shop-client/package.json#L13` |
| **API Client & Caching** | RTK Query | `^2.4.0` | `amar-shop-client/src/redux/api/baseApi.ts#L12-L23` |
| **State Persistence** | Redux Persist | `^6.0.0` | `amar-shop-client/package.json#L28` |
| **Client Routing** | React Router DOM | `^7.0.2` | `amar-shop-client/package.json#L25` |
| **Data Visualization** | Recharts | `^2.15.0` | `amar-shop-client/package.json#L27` |
| **Carousel / Sliders** | Swiper | `^11.1.15` | `amar-shop-client/package.json#L30` |
| **Icons & Notifications** | Lucide React / Sonner | `^1.14.0` / `^1.7.0` | `amar-shop-client/package.json#L15,L29` |
| **Backend Runtime** | Node.js | v18+ | `amar-shop-server/package.json#L23` |
| **Backend Framework** | Express.js | `^4.21.1` | `amar-shop-server/package.json#L38` |
| **Language (Backend)** | TypeScript | `^5.7.2` | `amar-shop-server/package.json#L28` |
| **Dev Execution Engine** | tsx / ts-node-dev | `^4.21.0` / `^2.0.0` | `amar-shop-server/package.json#L26-L27` |
| **Database Engine** | PostgreSQL (Neon Cloud) | PostgreSQL 16+ | `amar-shop-server/package.json#L46`, `.env#L2` |
| **Database ORM** | Prisma Client / CLI | `^6.19.3` | `amar-shop-server/package.json#L25,L32` |
| **Authentication & Tokens**| `jsonwebtoken` / `bcrypt` | `^9.0.2` / `^5.1.1` | `amar-shop-server/package.json#L34,L42` |
| **Payment Gateway** | SSLCommerz (Sandbox/Live)| Custom Axios API | `amar-shop-server/src/utils/payment.utils.ts#L1-L91` |
| **File Storage** | Cloudinary & Multer | `^4.0.0` / `^1.4.5`| `amar-shop-server/package.json#L43-L44` |
| **Validation** | Zod | `^3.23.8` | `amar-shop-server/package.json#L47` |
| **Security Headers / Limit**| `helmet` / `express-rate-limit`| `^8.3.0` / `^8.6.2` | `amar-shop-server/package.json#L39-L40` |
| **Mail Delivery** | Nodemailer | `^6.9.16` | `amar-shop-server/package.json#L45` |
| **Hosting & Deployment** | Vercel Serverless / Static | `@vercel/node` v2 | `vercel.json` (client & server) |

---

## 3. ARCHITECTURE

### 3.1 Directory Structure & Architectural Roles

```
RePolish/
├── amar-shop-client/                   # Frontend SPA Application
│   ├── public/                         # Static assets & favicon
│   ├── src/
│   │   ├── components/                 # Presentation and composite widgets
│   │   │   ├── admin/                  # Admin cards and chart widgets (some orphaned)
│   │   │   ├── customer/               # OrderTimeline, CheckoutFunnelSteps, OrderViewCard
│   │   │   ├── form/                   # Controlled inputs: ASInput, ASSelect, ASFileInput
│   │   │   ├── home/                   # Marketing sections, metrics, banners, timers
│   │   │   ├── modals/                 # Modals: VendorConflictModal, EditProduct, EditShop
│   │   │   ├── product/                # ProductCard, RecommendedProductsSection
│   │   │   ├── shared/                 # Navbar, Footer, Loading, EmptyState, ErrorPage
│   │   │   └── table/                  # Generic table wrappers (ASTable, ASUserTable)
│   │   ├── context/                    # ThemeContext (Light/Dark mode token persistence)
│   │   ├── hooks/                      # Custom React hooks (useRecentlyViewed, hook.ts)
│   │   ├── layouts/Dashboard/          # Admin, Vendor, and Customer sidebar-driven shells
│   │   ├── pages/                      # Route view controllers (Homepage, ProductPage, etc.)
│   │   ├── redux/                      # Global state architecture
│   │   │   ├── api/baseApi.ts          # Central RTK Query entry point with token refresh logic
│   │   │   ├── features/               # Redux slices: authSlice, cartSlice, comparisonSlice
│   │   │   └── services/               # Injected endpoint definitions (productApi, orderApi)
│   │   ├── routes/                     # React Router 7 config, role guards, lazy loaders
│   │   └── types/                      # Shared TypeScript domain interfaces
│   ├── tailwind.config.js              # Theme color palette, DaisyUI themes
│   └── vite.config.ts                  # Bundler config with React plugin
│
└── amar-shop-server/                   # Backend REST API Engine
    ├── prisma/
    │   └── schema.prisma               # Prisma data models, relations, and enums
    ├── src/
    │   ├── app/
    │   │   ├── errors/                 # AppError domain error class
    │   │   ├── helpers/                # jwtHelpers, paginationHelper (orphaned), fileUploader
    │   │   ├── interfaces/             # Express Request augmentation, file, image types
    │   │   ├── middlewares/            # auth, validateRequest, globalErrorHandler, bodyParser
    │   │   ├── modules/                # Domain-Driven Modules (Controllers, Services, Routes)
    │   │   │   ├── Admin/              # Governance: shops, users, coupons, analytics
    │   │   │   ├── Auth/               # Registration, login, password reset, token rotation
    │   │   │   ├── Customer/           # Orders, checkout, reviews, wishlist, telemetry
    │   │   │   ├── Payment/            # SSLCommerz IPN callbacks & confirmation
    │   │   │   ├── User/               # User profiles, role discovery
    │   │   │   └── Vendor/             # Product CRUD, shop profiles, fulfillment statuses
    │   │   └── routes/index.ts         # Unified Express router aggregation
    │   ├── config/                     # Cloudinary, Multer, and environment variable loaders
    │   ├── shared/                     # Prisma singleton instance, catchAsync, sendResponse
    │   ├── utils/                      # Payment utility (SSLCommerz) and root admin seeding
    │   ├── app.ts                      # Express app setup, CORS, Helmet, Rate Limiter
    │   └── server.ts                   # Process lifecycle, port listener, uncaught handlers
    └── vercel.json                     # Serverless rewrite to src/server.ts
```

### 3.2 Connectivity & Communication Topography
```
┌────────────────────────────────────────────────────────┐
│                   Vite + React SPA                     │
│         (Redux Toolkit + RTK Query Client)             │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON + Multipart)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Express.js Application Router             │
│   (Helmet, RateLimiter, CORS, CookieParser, BodyParser)│
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Database Transactions             │ Third-Party API
                │                        │ (Axios HTTPS)
                ▼                        ▼
┌──────────────────────────────┐  ┌───────────────────────┐
│     Neon Serverless Cloud    │  │ SSLCommerz Payment GW │
│     PostgreSQL Database      │  │ Cloudinary Storage    │
│      (via Prisma ORM)        │  │ Gmail SMTP Gateway    │
└──────────────────────────────┘  └───────────────────────┘
```

### 3.3 End-to-End Core Feature Data Flows

#### Flow 1: User Registration (`/api/auth/register`)
```
1. Client submits FormData (file + JSON payload: { password, role, user: { name, email, phone } })
   └─ File: src/pages/RegistrationPage.tsx#L59-L65
2. Express receives multipart request -> Multer buffers file and uploads to Cloudinary
   └─ File: src/config/multer.config.ts -> src/config/cloudinary.config.ts
3. Middleware `parseBody` deserializes `req.body.data` into JSON `req.body`
   └─ File: src/app/middlewares/bodyParser.ts#L4-L13
4. Middleware `validateRequest` parses payload against `UserValidation.createUserSchema`
   └─ File: src/app/middlewares/validateRequest.ts#L4-L17
5. Controller `AuthControllers.registerUser` delegates to `AuthServices.createUser`
   └─ File: src/app/modules/Auth/auth.controllers.ts#L7-L15
6. Service hashes password via bcrypt (12 rounds) and starts `prisma.$transaction`:
   - Inserts row into `users` table
   - Inserts row into role-specific table (`admins`, `customers`, or `vendors`) linking via `email`
   └─ File: src/app/modules/Auth/auth.services.ts#L49-L72
7. Service generates JWT Access Token and Refresh Token via `jwtHelpers.generateToken`
   └─ File: src/app/modules/Auth/auth.services.ts#L79-L94
8. Controller returns HTTP 200 with tokens in JSON response body
   └─ File: src/app/modules/Auth/auth.controllers.ts#L9-L14
```

#### Flow 2: Product Creation by Vendor (`/api/vendor/create-product`)
```
1. Vendor fills product details and uploads multiple images in AddProduct view
   └─ File: src/pages/vendorPages/AddProduct.tsx
2. Client submits multipart FormData to `/api/vendor/create-product`
   └─ File: src/redux/services/productApi.ts#L93-L100
3. Middleware `auth(UserRole.VENDOR)` verifies JWT token from Authorization header and sets `req.user`
   └─ File: src/app/middlewares/auth.ts#L8-L36
4. Multer processes uploaded image files into Cloudinary URLs
   └─ File: src/app/modules/Vendor/vendor.routes.ts#L20-L26
5. Middleware `parseBody` decodes JSON string in `req.body.data`
   └─ File: src/app/middlewares/bodyParser.ts#L4-L13
6. Controller `ProductControllers.createProduct` invokes `ProductServices.createProductIntoDB`
   └─ File: src/app/modules/Vendor/Products/product.controllers.ts#L8-L17
7. Service queries `prisma.shop.findFirst({ where: { vendorEmail: req.user.email, isDeleted: false } })`
   └─ File: src/app/modules/Vendor/Products/product.services.ts#L52-L57
8. Service validates category existence and creates record in `products` table
   └─ File: src/app/modules/Vendor/Products/product.services.ts#L73
9. Controller formats response via `sendResponse` and returns HTTP 200
```

#### Flow 3: Order Checkout & Payment Lifecycle (`/api/customer/checkout`)
```
1. Customer initiates checkout with shipping info and cart items
   └─ File: src/pages/customerPages/CheckoutPage.tsx#L92-L141
2. Client sends order payload to `POST /api/customer/checkout`
   └─ File: src/redux/services/orderApi.ts#L6-L12
3. Middleware `auth(UserRole.CUSTOMER)` authorizes buyer via JWT
   └─ File: src/app/middlewares/auth.ts
4. Service `CustomerServices.createOrderIntoDB` executes:
   - Queries `prisma.customer` to confirm buyer profile exists
   - Iterates through `OrderItem` array, querying `prisma.product` from DB for each item
   - Verifies `product.inventoryCount >= item.quantity`
   - Calculates item price using DB `price` and DB `discount` (ignoring client prices)
   - Checks coupon in `coupons` table and applies percentage deduction
   - Generates transaction ID `TNX-${Date.now()}`
   - Executes `prisma.$transaction`: creates `Order`, creates all `OrderItem` rows, creates `Transaction` row
   └─ File: src/app/modules/Customer/customer.services.ts#L12-L130
5. Outside the DB transaction, invokes `initiatePayment` which posts URL-encoded payload to SSLCommerz API
   └─ File: src/utils/payment.utils.ts#L12-L59
6. SSLCommerz responds with `GatewayPageURL`; server returns it to client
7. Client redirects buyer's browser to `GatewayPageURL` (`CheckoutPage.tsx#L128`)
8. Upon payment completion, SSLCommerz redirects buyer to server confirmation URL:
   `GET /api/payment/confirmation?transactionId=...&status=success`
   └─ File: src/app/modules/Payment/payment.controllers.ts#L4-L17
9. Service `confirmationService` handles callback:
   - Executes `prisma.$transaction`: marks `Transaction` as PAID, marks `Order` as COMPLETED, decrements `product.inventoryCount`
   - Generates responsive HTML page with auto-redirect `<meta http-equiv="refresh">` and window.top redirection script
   └─ File: src/app/modules/Payment/payment.services.ts#L68-L150
10. Customer browser is redirected to client `/customerDashboard/myOrder?payment=success&tran_id=...`
11. Client clears Redux cart state and displays success toast (`MyOrders.tsx#L41-L49`)
```

---

## 4. DATABASE ARCHITECTURE

### 4.1 Schema Models, Fields & Relationships

Source File: [`amar-shop-server/prisma/schema.prisma`](file:///f:/web%20development/RePolish/amar-shop-server/prisma/schema.prisma)

| Model / Table | Primary Key | Key Attributes & Types | Relations |
|---|---|---|---|
| **User (`users`)** | `id String @id @default(uuid())` | `email String @unique`, `password String`, `role UserRole`, `needPasswordChange Boolean`, `status UserStatus?`, `isDeleted Boolean?` | 1-to-1 with `Admin`, `Customer`, `Vendor` (joined on `email`) |
| **Admin (`admins`)** | `id String @id @default(uuid())` | `name String`, `email String @unique`, `phone String?`, `image String?`, `isDeleted Boolean?` | Belongs to `User` via `email` |
| **Customer (`customers`)** | `id String @id @default(uuid())` | `name String`, `email String @unique`, `image String?`, `phone String?`, `isDeleted Boolean?` | Belongs to `User` via `email`. 1-to-many: `Order`, `Review`, `Follow`, `Wishlist` |
| **Vendor (`vendors`)** | `id String @id @default(uuid())` | `name String`, `email String @unique`, `image String?`, `phone String?`, `isDeleted Boolean?` | Belongs to `User` via `email`. 1-to-many: `Shop` |
| **Shop (`shops`)** | `id String @id @default(uuid())` | `vendorEmail String`, `name String`, `logoUrl String?`, `description String? @db.Text`, `isDeleted Boolean`, `isBlacklisted Boolean` | Belongs to `Vendor` via `vendorEmail`. 1-to-many: `Product`, `Follow` |
| **Category (`categories`)** | `id String @id @default(uuid())` | `name String @unique @db.VarChar(50)`, `description String?`, `logoUrl String?`, `isDeleted Boolean` | 1-to-many: `Product` |
| **Product (`products`)** | `id String @id @default(uuid())` | `shopId String`, `categoryId String`, `name String @db.VarChar(150)`, `description String? @db.Text`, `price Decimal(10,2)`, `discount Int`, `inventoryCount Int`, `imageUrl String[]`, `isDeleted Boolean` | Belongs to `Shop`, `Category`. 1-to-many: `Review`, `OrderItem`, `Wishlist` |
| **Wishlist (`wishlists`)** | `id String @id @default(uuid())` | `customerEmail String`, `productId String`, `createdAt DateTime` | Belongs to `Customer` (`customerEmail`), `Product` (`productId`). Composite unique: `[customerEmail, productId]` |
| **Order (`orders`)** | `id String @id @default(uuid())` | `customerEmail String`, `status OrderStatus`, `totalAmount Decimal(10,2)`, `paymentMethod String`, `paymentStatus PaymentStatus`, `shippingAddress String?`, `shippingCity String?`, `shippingZipCode String?`, `shippingPhone String?` | Belongs to `Customer`. 1-to-many: `OrderItem`, `Transaction` |
| **OrderItem (`order_items`)**| `id String @id @default(uuid())` | `orderId String`, `productId String`, `quantity Int`, `price Decimal(10,2)`, `isReviewed Boolean` | Belongs to `Order`, `Product` |
| **Transaction (`transactions`)**| `id String @id @default(uuid())` | `orderId String`, `transactionId String @unique`, `amount Decimal(10,2)`, `paymentStatus PaymentStatus` | Belongs to `Order` |
| **Review (`reviews`)** | `id String @id @default(uuid())` | `productId String`, `customerEmail String`, `rating Int`, `comment String? @db.Text` | Belongs to `Product`, `Customer` |
| **Follow (`follows`)** | `id String @id @default(uuid())` | `customerEmail String`, `shopId String` | Belongs to `Customer`, `Shop`. Composite unique: `[customerEmail, shopId]` |
| **Coupon (`coupons`)** | `id String @id @default(uuid())` | `code String @unique`, `discountPercent Int` | No relations |

### 4.2 Database Design & Relational Defects

1. **Foreign Keys Referenced on Mutable Natural Key (`email`) Instead of Surrogate UUID:**
   - In `Admin`, `Customer`, `Vendor`, `Shop`, `Order`, `Review`, `Follow`, and `Wishlist`, foreign keys reference `email` (`user User @relation(fields: [email], references: [email])`).
   - *Architectural Risk:* Email addresses are user-modifiable credentials. Modifying a user's email will immediately fail or corrupt referential integrity across 8 separate tables because there is no `onUpdate: Cascade` defined on any relation in `schema.prisma`. All relations should reference the immutable surrogate primary key `userId (UUID)`.
2. **Missing Multi-Vendor Tenant Boundary on `Order`:**
   - `Order` does NOT have a `shopId` or `vendorId`.
   - *Architectural Risk:* In a multi-vendor platform, an order can contain items from multiple boutiques. Because `status` (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) exists only on `Order` (and not on `OrderItem`), if Vendor A transitions an order status in `updateOrderStatusIntoDB` (`vendor.sevices.ts#L142-L145`), **it mutates the entire order for Vendor B's items as well**.
3. **Under-Specified `Coupon` Table:**
   - `Coupon` contains only `id`, `code`, `discountPercent`, `createdAt`.
   - *Missing Constraints:* No `expirationDate`, no `maxUsageLimit`, no `usageCount`, no `minPurchaseAmount`, and no `isActive` boolean flag. Any coupon created remains valid indefinitely for unlimited uses.
4. **Denormalized Media Storage (`imageUrl String[]`):**
   - Storing image URLs as a PostgreSQL native array (`String[]`) limits image metadata (e.g., sorting order, alt text, primary cover flag) and makes indexing individual images impossible.
5. **Redundant Deletion State Tracking:**
   - `User` table contains both `status: UserStatus (ACTIVE, BLOCKED, DELETED)` and `isDeleted: Boolean`. In multiple services, code checks `isDeleted: false` while ignoring `status: DELETED`, leading to state inconsistency.

---

## 5. API / ROUTES AUDIT

### 5.1 Comprehensive Endpoint Catalog

| HTTP Method | Route Endpoint | Module / Controller | Auth Required | Purpose / Operation | Zod Validation |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | `AuthControllers.registerUser` | Public | Register Customer or Vendor (Allows Admin) | `createUserSchema` |
| `POST` | `/api/auth/login` | `AuthControllers.loginUser` | Public | User authentication; issues JWT tokens | `loginSchema` |
| `POST` | `/api/auth/refresh-token` | `AuthControllers.refreshToken` | Public (Cookie) | Rotates and returns new access token | **None** |
| `POST` | `/api/auth/change-password` | `AuthControllers.changePassword` | Any Auth | Update authenticated user password | **None** |
| `POST` | `/api/auth/forgot-password` | `AuthControllers.forgotPassword` | Public | Generates reset token & sends email | **None** |
| `POST` | `/api/auth/reset-password` | `AuthControllers.resetPassword` | Public (Header) | Resets password using emailed token | **None** |
| `GET` | `/api/user` | `UserControllers.getAllUser` | `ADMIN` | Fetch all system users (unpaginated) | **None** |
| `GET` | `/api/user/me` | `UserControllers.getMyProfile` | Any Auth | Fetch current user authenticated profile | **None** |
| `PATCH`| `/api/user/update-user` | `UserControllers.updateMyProfie` | Any Auth | Update profile photo and personal info | **Bypassed Order** |
| `GET` | `/api/admin/users` | `UserControllers.getAllUser` | `ADMIN` | Duplicate endpoint for user listing | **None** |
| `POST` | `/api/admin/create-category` | `CategoryControllers.createCategory`| `ADMIN` | Upload category logo & create category | **None** |
| `PATCH`| `/api/admin/edit-category` | `CategoryControllers.updateCategory`| `ADMIN` | Update category name/logo | **None** |
| `DELETE`|`/api/admin/delete-category/:id`| `CategoryControllers.deleteCategory`| `ADMIN` | Soft-delete category | **None** |
| `DELETE`|`/api/admin/delete-user/:u_id`| `AdminControllers.deleteUser` | `ADMIN` | Soft-delete user and related profile | **None** |
| `PATCH`| `/api/admin/suspend-user/:id`| `AdminControllers.suspendUser` | `ADMIN` | Toggle user ACTIVE / BLOCKED status | **None** |
| `GET` | `/api/admin/all-shops` | `AdminControllers.getAllShops` | Public | List all un-deleted vendor shops | **None** |
| `PATCH`| `/api/admin/block-shop/:id` | `AdminControllers.blockShop` | `ADMIN` | Toggle shop `isBlacklisted` status | **None** |
| `GET` | `/api/admin/all-transactions` | `AdminControllers.getAllTransactions`| `ADMIN` | List all payment transaction records | **None** |
| `POST` | `/api/admin/create-coupon` | `AdminControllers.createCoupon` | `ADMIN` | Create global percentage coupon | **None** |
| `POST` | `/api/admin/check-coupon` | `AdminControllers.checkCoupon` | Public | Query discount percentage for a coupon | **None** |
| `GET` | `/api/admin/dashboard-stats` | `AdminControllers.getDashboardStats`| `ADMIN` | Platform gross revenue, orders, trends | **None** |
| `POST` | `/api/customer/checkout` | `CustomerControllers.createOrder` | `CUSTOMER` | Validate stock, price, start SSLCommerz| **None** |
| `POST` | `/api/customer/add-review` | `CustomerControllers.addReview` | `CUSTOMER` | Submit 1-5 star product rating & review| **None** |
| `GET` | `/api/customer/orderItemForReview`| `CustomerControllers.getItemForReview`| `CUSTOMER` | Get paid items not yet reviewed | **None** |
| `GET` | `/api/customer/myOrderHistory` | `CustomerControllers.getMyOrderHistory`| `CUSTOMER` | Get buyer order items and fulfillment | **None** |
| `POST` | `/api/customer/wishlist/toggle` | `CustomerControllers.toggleWishlist`| `CUSTOMER` | Add / remove product from wishlist | **None** |
| `GET` | `/api/customer/wishlist` | `CustomerControllers.getMyWishlist` | `CUSTOMER` | Retrieve all items in buyer wishlist | **None** |
| `GET` | `/api/customer/dashboard-stats`| `CustomerControllers.getDashboardStats`| `CUSTOMER` | Customer lifetime spend & deliveries | **None** |
| `GET` | `/api/payment/confirmation` | `PaymentController.confirmationController`| Public | Handle payment success/fail redirect | **None** |
| `POST` | `/api/payment/confirmation` | `PaymentController.confirmationController`| Public | Handle payment success/fail POST | **None** |
| `POST` | `/api/payment/ipn` | `PaymentController.confirmationController`| Public | Handle SSLCommerz IPN webhook | **None** |
| `POST` | `/api/vendor/create-shop` | `ShopControllers.createShop` | `VENDOR` | Register new merchant shop boutique | **None** |
| `POST` | `/api/vendor/create-product` | `ProductControllers.createProduct` | `VENDOR` | Upload photos and list new product | **None** |
| `POST` | `/api/vendor/duplicate-product/:id`| `ProductControllers.duplicateProduct`| `VENDOR` | Clone product details into copy | **None** |
| `PATCH`| `/api/vendor/update-product` | `ProductControllers.updateProduct` | `VENDOR` | Update product price, inventory, photo | **None** |
| `PATCH`| `/api/vendor/update-shop` | `ShopControllers.updateShop` | `VENDOR` | Update shop name, bio, cover image | **None** |
| `DELETE`|`/api/vendor/delete-product/:id`| `ProductControllers.deleteProduct` | `VENDOR` | Soft-delete product | **None** |
| `GET` | `/api/vendor/get-products` | `VendorControllers.getProducts` | `VENDOR` | List all products belonging to vendor | **None** |
| `GET` | `/api/vendor/order-history` | `VendorControllers.getOrderHistory`| `VENDOR` | List orders containing vendor products | **None** |
| `PATCH`| `/api/vendor/update-order-status/:id`| `VendorControllers.updateOrderStatus`| `VENDOR` | Transition order status | **None** |
| `GET` | `/api/vendor/get-my-shop` | `ShopControllers.getMyShop` | `VENDOR` | Retrieve shops owned by vendor | **None** |
| `GET` | `/api/vendor/dashboard-stats` | `VendorControllers.getDashboardStats`| `VENDOR` | Vendor earnings, orders to fulfill, chart | **None** |
| `GET` | `/api/product` | `ProductControllers.getAllProducts` | Public | Filtered catalog with pagination & sort | **None** |
| `GET` | `/api/product/flashSaleProducts`| `ProductControllers.getFlashSaleProducts`| Public | Unpaginated list of discounted items | **None** |
| `GET` | `/api/product/recommendations/:id`| `ProductControllers.getRecommendedProducts`| Public| Proximity-based recommendation list | **None** |
| `GET` | `/api/product/review/:id` | `ProductControllers.getReviews` | Public | Paginated reviews for product | **None** |
| `GET` | `/api/product/:id` | `ProductControllers.getSingleProduct`| Public | Single product specification details | **None** |
| `GET` | `/api/category` | `CategoryControllers.getAllCategories`| Public | All categories (includes deleted ones) | **None** |
| `GET` | `/api/shop/:id` | `ShopControllers.getSingleShop` | Public | Public boutique storefront details | **None** |
| `GET` | `/api/shop/products/:id` | `ShopControllers.getProductsByShop` | Public | All products in a specific boutique | **None** |
| `POST` | `/api/shop/follow/:id` | `ShopControllers.followShop` | `CUSTOMER` | Follow a boutique store | **None** |
| `DELETE`|`/api/shop/unfollow/:id` | `ShopControllers.unfollowShop` | `CUSTOMER` | Unfollow a boutique store | **None** |
| `GET` | `/api/shop/followers/:id` | `ShopControllers.getFollowers` | Public | Get follower records for a shop | **None** |

### 5.2 Middleware Flaws & Validation Audit
1. **Broken Middleware Execution Pipeline on Profile Update:**
   - In `UserRoutes` (`src/app/modules/User/user.routes.ts#L12-L19`):
     ```typescript
     router.patch(
       "/update-user",
       auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR),
       fileUploader.single("file"),
       validateRequest(UserValidation.updateUserSchema), // <--- Runs BEFORE parseBody!
       parseBody,
       UserControllers.updateMyProfie
     );
     ```
     Because `validateRequest` executes before `parseBody`, `req.body` has not yet been extracted from `req.body.data`. Zod parses raw multipart boundaries, causing silent validation failure or bypassed validation.
2. **Defective `globalErrorHandler`:**
   - In `src/app/middlewares/globalErrorHandler.ts#L11-L37`:
     ```typescript
     let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
     // ... Prisma handlers ...
     } else if (err instanceof Error) {
       message = err.message;
       error = err.message;
     }
     ```
     Custom domain exceptions thrown via `new AppError(401, "...")` or `new AppError(404, "...")` inherit from `Error`. Because the handler never checks `err instanceof AppError` or sets `statusCode = err.statusCode`, **EVERY custom user error (Unauthorized, Forbidden, Bad Input, Not Found) returns HTTP 500 Internal Server Error**.

---

## 6. AUTHENTICATION & SECURITY

### 6.1 Vulnerability Matrix

| Vulnerability | Severity | CWE | Location | Impact |
|---|---|---|---|---|
| **Public Privilege Escalation to ADMIN** | **CRITICAL** | CWE-269 | `user.validation.ts#L8`, `auth.services.ts#L54-L59` | Any public visitor can send `role: "ADMIN"` during registration and instantly obtain full platform administrative rights. |
| **Payment Gateway Verification Bypass** | **CRITICAL** | CWE-305 | `payment.services.ts#L44-L65`, `payment.controllers.ts#L5-L16` | Fallback logic sets `isPaymentSuccessful = true` on every branch and catch block. A simple GET request with `?status=success` marks any order PAID. |
| **Bypassed Authorization on Product Deletion & Update** | **CRITICAL** | CWE-639 (IDOR) | `product.services.ts#L82-L144` | Vendor A can send an update or delete request for Vendor B's product `id`. The backend never validates product ownership. |
| **Bypassed Authorization on Shop Modification** | **CRITICAL** | CWE-639 (IDOR) | `shop.services.ts#L86-L104` | Any vendor can send `id` of any other shop in `updateShopIntoDB` and overwrite their name, bio, and logo. |
| **Broken Password Reset IDOR** | **HIGH** | CWE-640 | `auth.services.ts#L251-L281` | The reset password handler accepts any valid reset token and resets the password for any `userId` passed in payload. |
| **Exposed Production Secrets on Disk** | **HIGH** | CWE-798 | `amar-shop-server/.env` | Contains live Neon DB credentials (pointing to shadow DB), Cloudinary API secrets, and a plain-text Google App Password. |
| **Hardcoded Root Admin Demo Credentials** | **HIGH** | CWE-798 | `LoginPage.tsx#L53`, `seeding.ts#L42-L48` | Hardcoded `admin@amarShop.com` / `admin@12345` allows any user on the client login screen to log in as root Admin. |
| **Refresh Token Leakage in Response Body** | **MEDIUM** | CWE-359 | `auth.controllers.ts#L34` | Returning `refreshToken` in JSON response defeats the purpose of the `httpOnly` cookie and exposes it to XSS token theft. |
| **JWT Storage in Unprotected LocalStorage** | **MEDIUM** | CWE-922 | `store.ts#L19-L35` | Redux-Persist serializes the access token into browser `localStorage`, making it vulnerable to XSS exfiltration. |
| **Disabled TLS Validation in Nodemailer** | **MEDIUM** | CWE-295 | `emailSender.ts#L14` | Configures `rejectUnauthorized: false`, exposing outgoing SMTP credentials and reset links to Man-in-the-Middle (MitM) attacks. |
| **Stale JWT Token Acceptance for Suspended Users** | **MEDIUM** | CWE-613 | `auth.ts#L8-L36` | `auth` middleware only checks JWT signature. A suspended/blocked/deleted user's 1-day token remains fully operational. |

### 6.2 Injection & Cross-Site Scripting (XSS) Analysis
- **SQL / NoSQL Injection:** Negligible risk. All database queries utilize Prisma ORM parameterized queries (`findUnique`, `findMany`, `create`, `update`). No raw SQL `$queryRawUnsafe` calls exist in the server.
- **Cross-Site Scripting (XSS):** Medium risk. React escapes JSX values by default. However:
  1. `PaymentService.confirmationService` dynamically concatenates unescaped user-controlled values (`transactionId`, `title`, `message`, `targetUrl`) directly into raw HTML template strings (`payment.services.ts#L153-L260`).
  2. `emailSender.ts` concatenates user parameters into HTML emails without HTML entity encoding.

---

## 7. CODE QUALITY

### 7.1 Consistency, Naming & Typographical Defects
1. **Filename Typo in Backend Modules:**
   - File path: [`amar-shop-server/src/app/modules/Vendor/vendor.sevices.ts`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Vendor/vendor.sevices.ts) is misspelled as `vendor.sevices.ts` (missing 'r'). This misspelled filename is referenced in `vendor.controllers.ts#L4`.
2. **Controller Function Typos:**
   - `UserControllers.updateMyProfie` in `user.controllers.ts#L17` is misspelled (`updateMyProfie` instead of `updateMyProfile`).
3. **Response Message Typos:**
   - The word "successfully" is misspelled as "successfuly" across all controllers:
     * `auth.controllers.ts#L12`: `"User Registration Completed successfuly!"`
     * `vendor.controllers.ts#L11`: `"Product retrieved successfuly!"`
     * `product.controllers.ts#L14`: `"New Product added successfuly!"`
     * `shop.controllers.ts#L11`: `"Shop Registration Completed successfuly!"`
4. **Copy-Paste Message Mismatches:**
   - `admin.controllers.ts#L51`: `getAllTransactions` controller responds with `message: "Shop blocked successfully"`.
   - `vendor.controllers.ts#L20`: `getOrderHistory` controller responds with `message: "Product retrieved successfuly!"`.
   - `shop.services.ts#L86`: `updateShopIntoDB` assigns validation variable `const isProductExist = ...` when searching for a shop.
   - `shop.services.ts#L169`: `unfollowShop` assigns variable `const review = ...` when querying follow records.

### 7.2 Dead Code & Orphaned Files

| Orphaned File / Symbol | Location | Evidence of Non-Usage |
|---|---|---|
| `RevenueChart.tsx` | `amar-shop-client/src/components/admin/RevenueChart.tsx` | Component is defined and exported, but never imported in any file in `src/`. |
| `VendorRevenueChart.tsx` | `amar-shop-client/src/components/vendor/VendorRevenueChart.tsx` | Component is defined and exported, but never imported in any file in `src/`. |
| `TotalShopCard.tsx` | `amar-shop-client/src/components/admin/TotalShopCard.tsx` | Defined and exported, zero references across entire codebase. |
| `TotalUserCard.tsx` | `amar-shop-client/src/components/admin/TotalUserCard.tsx` | Defined and exported, zero references across entire codebase. |
| `TriangleBar.tsx` | `amar-shop-client/src/components/admin/Shape/TriangleBar.tsx` | Only referenced inside orphaned `RevenueChart` and `VendorRevenueChart`. |
| `fileUploader.ts` | `amar-shop-server/src/app/helpers/fileUploader.ts` | 100% of the file is commented out (lines 1-22). |
| `validateImageFileRequest.ts` | `amar-shop-server/src/app/middlewares/validateImageFileRequest.ts`| Defined and exported, never imported in any route or controller. |
| `paginationHelper.ts` | `amar-shop-server/src/app/helpers/paginationHelper.ts` | Exported `paginationHelper` is never imported by any server service. |
| `pick.ts` | `amar-shop-server/src/shared/pick.ts` | Utility is defined but never invoked anywhere in server. |

### 7.3 Architectural Violations & Redux Anti-Patterns
In `cartSlice.ts` (`src/redux/features/cartSlice.ts#L32-L34` & `L82-L84`):
```typescript
if (state.vendorId && state.vendorId !== product?.shop?.id) {
  throw new Error("DIFFERENT_VENDOR_DETECTED"); // Custom error identifier
}
```
**Throwing an exception from within a Redux reducer is a severe anti-pattern.** Redux reducers MUST be pure, deterministic functions without side effects or unhandled exceptions. Throwing inside a reducer can corrupt the Redux state tree, break persistence middleware (`redux-persist`), and crash React rendering if not caught in dispatch wrappers.

### 7.4 TypeScript Strictness & Type Safety
- Over 46 occurrences of explicit `any` types across both client and server (`jwtHelpers.ts#L3`, `auth.services.ts#L174`, `baseApi.ts#L47`, `ProductCard.tsx#L48`).
- Server `tsconfig.json` has `strict: true`, but leaves all other strict flags commented out (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`).
- Client `baseApi.ts#L47` uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.

---

## 8. TESTING & DEVOPS

### 8.1 Test Coverage Analysis
- **Unit Tests:** None found (`0` test files).
- **Integration Tests:** None found (`0` test files).
- **End-to-End (E2E) Tests:** None found (`0` test files).
- **Test Scripts:** Neither `amar-shop-server/package.json` nor `amar-shop-client/package.json` includes a `test` npm script.
- **Overall Code Coverage:** **0.00%**.

### 8.2 CI/CD & Automation
- **Continuous Integration:** Not found. No `.github/workflows`, `.gitlab-ci.yml`, or Bitbucket pipelines exist in either repository.
- **Automated Linting/Build Gate:** No pull request checks exist to prevent breaking changes or failing TypeScript builds from being merged.

### 8.3 Containerization & Infrastructure as Code
- **Docker / Docker Compose:** Not found. Neither `Dockerfile` nor `docker-compose.yml` exists. Developers must manually configure local PostgreSQL instances and environment files.

### 8.4 Environment Management & Logging
- **Missing Template Files:** `amar-shop-server/.env.example` does not exist, despite the server README instructing users to run `cp .env.example .env`.
- **Database Connection Pointing to Neon Shadow DB:** In `amar-shop-server/.env#L2`, the active `DATABASE_URL` is configured to `prisma_migrate_shadow_db_85c7c852...`. Using a Prisma shadow database as the live runtime database is an operational hazard; shadow databases can be dropped or altered during migration lifecycles.
- **Logging Strategy:** The application relies exclusively on raw, unstructured `console.log` and `console.error` calls. No structured logging framework (Pino, Winston) or distributed tracing exists.

---

## 9. PERFORMANCE & SCALABILITY

### 9.1 The Frontend N+1 Query Cascade
In [`ProductCard.tsx`](file:///f:/web%20development/RePolish/amar-shop-client/src/components/product/ProductCard.tsx#L55):
```typescript
const { data: reviews } = useGetReviewsSingleProductQuery(product.id);
```
Every `ProductCard` component independently executes `useGetReviewsSingleProductQuery(product.id)`. Browsing a page with 30 products fires 30 extra HTTP queries to the backend.
- If the catalog displays 24 products, **25 HTTP requests are dispatched simultaneously (1 for the catalog + 24 for reviews)**.
- Under high concurrency, this saturates browser connection limits (HTTP/1.1 max 6 per domain) and floods the server with redundant database roundtrips.
- *Fix:* The backend `getAllProductsFromDB` query must join and aggregate reviews (`_avg.rating`, `_count.Review`) directly in the database.

### 9.2 Missing Database-Level Pagination (Memory Exhaustion Risk)
The following database queries return unpaginated datasets directly into Node.js heap memory:
1. `UserServices.getAllUsersFromDB` (`user.services.ts#L25-L53`): Loads all users, admins, customers, and vendors in a single query.
2. `AdminServices.getAllShopsFromDB` (`admin.services.ts#L99-L111`): Loads all merchant shops in a single query.
3. `AdminServices.getAllTransactionsFromDB` (`admin.services.ts#L152-L162`): Loads the entire transaction ledger in a single query.
4. `VendorServices.getOrderHistoryFromDB` (`vendor.sevices.ts#L48-L88`): Queries all historical order items for a vendor without `skip` or `take`.
5. `ProductServices.getFlashSaleProductsFromDB` (`product.services.ts#L311-L322`): Loads every discounted product in the platform without pagination.
6. `ShopServices.getProductsByShopFromDB` (`shop.services.ts#L132-L146`): Loads all products for a shop at once.

### 9.3 In-Memory Analytics Bottlenecks
In `AdminServices.getAdminDashboardStatsFromDB` (`admin.services.ts#L211-L260`):
```typescript
const transactions = await prisma.transaction.findMany({
  where: { paymentStatus: "PAID" },
  select: { amount: true, createdAt: true },
});
const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
transactions.forEach((t) => { /* bucket into months in Node memory */ });
```
Instead of executing a database-level `SUM()` or SQL `GROUP BY date_trunc('month', createdAt)`, the service pulls every paid transaction into Node.js memory and iterates through them using Javascript `.reduce()` and `.forEach()`. When the transaction table reaches 50,000+ rows, this endpoint will suffer from high memory consumption, garbage collection freezes, and CPU saturation.

### 9.4 Sabotaged RTK Query Cache (`keepUnusedDataFor: 0`)
Across virtually every API service in the client (`productApi.ts#L26,L40,L54`, `orderApi.ts#L28,L41,L54`, `shopApi.ts#L20,L28,L60,L69`, `userApi.ts#L12,L37,L51`, `vendorApi.ts#L13,L26,L47`), the configuration explicitly sets:
```typescript
keepUnusedDataFor: 0
```
This forces RTK Query to instantly purge its cache the millisecond a component unmounts. Navigating between tabs or opening/closing modals forces complete, repeated refetches of static and semi-static data, nullifying client-side caching.

---

## 10. FEATURE COMPLETENESS

### 10.1 Feature Implementation Audit

| Feature Area | Sub-Feature | Implementation Status | Evidence / Notes |
|---|---|---|---|
| **Catalog & Browsing** | Search & Keyword Filter | **DONE** | Case-insensitive multi-field search (`product.services.ts#L178`) |
| | Category Filter | **DONE** | Supports filter by category ID or name (`ProductPage.tsx`) |
| | Dynamic Price Range Slider| **DONE** | Min/max bounds passed to backend `gte`/`lte` (`ProductPage.tsx`) |
| | Stock Filter Toggle | **DONE** | In-stock filter query supported (`product.services.ts#L203`) |
| | Product Sorting | **DONE** | Price asc/desc, discount, newest supported (`ProductPage.tsx`) |
| | Proximity Recommendations | **DONE** | Mathematical price proximity algorithm (`product.services.ts#L360`) |
| | Product Comparison Matrix | **DONE** | Up to 3 products in floating matrix (`ComparisonPage.tsx`) |
| | Recently Viewed Carousel | **DONE** | Tracks history via custom hook & slice (`useRecentlyViewed.ts`) |
| **Cart & Checkout** | Single-Boutique Restriction | **DONE** | Conflict modal on multi-boutique item (`VendorConflictModal.tsx`) |
| | Coupon Application Engine | **PARTIALLY DONE** | Works in UI, but frontend hardcodes fallback codes not in DB |
| | Tax (5% VAT) & Shipping | **INCONSISTENT** | Frontend computes $15 shipping & 5% VAT; Backend omits both |
| | SSLCommerz Payment Gateway | **DEFECTIVE** | Bypass bug marks all callback statuses as successful |
| **Order Telemetry** | 4-Stage Lifecycle Stepper | **DONE** | Visual milestone telemetry (`OrderTimeline.tsx`) |
| | Order History Tracking | **DONE** | Buyer reviews live fulfillment stages (`MyOrders.tsx`) |
| | Multi-Vendor Order Isolation| **MISSING** | Vendor status change mutates entire order for all boutiques |
| **Vendor Tools** | Boutique Profile Setup | **DONE** | Cover photo, logo, description, copy URL (`MyShop.tsx`) |
| | Product CRUD & Multi-Image | **DONE** | Cloudinary uploads, discount tagging (`AddProduct.tsx`) |
| | Product Duplication | **DONE** | Clones product specs into a copy (`ManageProduct.tsx`) |
| | Boutique Editing Photo Bug | **DEFECTIVE** | Backend expects `imageUrl` instead of `logoUrl`, throws validation error |
| **Admin Tools** | Account Suspension | **DONE** | Toggles ACTIVE / BLOCKED state (`ManageUser.tsx`) |
| | Boutique Blacklisting | **DONE** | Toggles `isBlacklisted` state (`ManageShop.tsx`) |
| | Financial Transaction Ledger | **DONE** | Full transaction view with SSL IDs (`ViewTransaction.tsx`) |
| | Platform Telemetry Dashboard | **DONE** | Revenue area charts & KPI statistics (`AdminProfile.tsx`) |
| | Coupon Management | **PARTIALLY DONE** | Creation form exists, but no coupon list, edit, or delete UI |
| **General Pages** | FAQ & Policy Pages | **DONE** | Static FAQ, Returns, Shipping, Privacy, Terms pages present |
| | Contact Us Form | **STUBBED** | Form resets and displays mock toast without dispatching API call |

### 10.2 TODO and FIXME Audit
- A search for `TODO` and `FIXME` comments across the entire codebase revealed **0 results**.
- Instead of formal `TODO` tags, incomplete logic was left as commented-out blocks (e.g. `fileUploader.ts#L1-L22`, `auth.services.ts#L45-L47`, `user.services.ts#L7-L23`) or silent fallback catches.

---

## 11. TOP 10 PROBLEMS & ARCHITECTURAL REMEDIATIONS

### 1. Critical Privilege Escalation via Public Registration
- **Severity:** **CRITICAL**
- **Location:** [`amar-shop-server/src/app/modules/User/user.validation.ts#L8`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/User/user.validation.ts#L8), [`amar-shop-server/src/app/modules/Auth/auth.services.ts#L54-L71`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Auth/auth.services.ts#L54-L71)
- **Problem:** `createUserSchema` accepts `role: z.enum(["ADMIN", "VENDOR", "CUSTOMER"])`. The registration service directly creates an `Admin` record if `role === "ADMIN"`. Any malicious actor can register an admin account directly via API.
- **Remediation:** Remove `"ADMIN"` from public registration validation schema. Force public registration to only accept `CUSTOMER` or `VENDOR`. Administrative accounts must only be provisioned internally through authenticated admin operations or seed scripts:
  ```typescript
  // user.validation.ts
  role: z.enum(["VENDOR", "CUSTOMER"]),
  ```

### 2. Complete Payment Verification Bypass in SSLCommerz Handler
- **Severity:** **CRITICAL**
- **Location:** [`amar-shop-server/src/app/modules/Payment/payment.services.ts#L44-L65`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Payment/payment.services.ts#L44-L65), [`amar-shop-server/src/app/modules/Payment/payment.controllers.ts#L5-L16`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Payment/payment.controllers.ts#L5-L16)
- **Problem:** In `confirmationService`, every failure fallback and `catch` block explicitly sets `isPaymentSuccessful = true;`. Anyone can hit `GET /api/payment/confirmation?transactionId=TNX-...&status=success` and the server will mark the order as `PAID` without verifying transactions against SSLCommerz.
- **Remediation:** Remove all sandbox fallback bypasses. Validate incoming SSLCommerz IPN payloads using SSLCommerz hash validation or require a valid `val_id` that returns `VALID` from SSLCommerz validation API before updating payment status:
  ```typescript
  if (!valId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment validation ID missing");
  }
  const verification = await verifyPayment(valId);
  if (verification?.status !== "VALID" && verification?.status !== "VALIDATED") {
    isPaymentSuccessful = false;
  } else {
    isPaymentSuccessful = true;
  }
  ```

### 3. Broken Access Control (IDOR) on Product & Shop Modifications
- **Severity:** **CRITICAL**
- **Location:** [`product.services.ts#L82-L144`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Vendor/Products/product.services.ts#L82-L144), [`shop.services.ts#L86-L104`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Vendor/Shops/shop.services.ts#L86-L104)
- **Problem:** `updateProductIntoDB`, `deleteProductFromDB`, and `updateShopIntoDB` accept an `id` and execute the mutation without checking that the item belongs to the authenticated vendor's shop (`req.user.email`). Any vendor can alter or delete any competitor's products or boutique profiles.
- **Remediation:** Enforce ownership checks in Prisma queries by querying the relationship:
  ```typescript
  const product = await prisma.product.findFirst({
    where: {
      id: product_id,
      shop: { vendorEmail: req.user.email },
      isDeleted: false,
    },
  });
  if (!product) throw new AppError(httpStatus.FORBIDDEN, "Unauthorized access to product");
  ```

### 4. Broken Password Reset Logic Allowing Account Takeover
- **Severity:** **HIGH**
- **Location:** [`amar-shop-server/src/app/modules/Auth/auth.services.ts#L251-L281`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Auth/auth.services.ts#L251-L281)
- **Problem:** `resetPassword` takes `token` and `payload: { userId, password }`. It verifies that `token` is a valid JWT signed with `reset_pass_secret`, but never validates that the email in the decoded token matches the `userId` in the payload. Anyone with a valid reset token for their own account can pass another user's `userId` and reset their password.
- **Remediation:** Extract user identity directly from the verified token payload rather than from the request body:
  ```typescript
  const decoded = jwtHelpers.verifyToken(token, config.reset_pass_secret as Secret);
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: decoded.email, status: UserStatus.ACTIVE },
  });
  const password = await bcrypt.hash(payload.password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password } });
  ```

### 5. Multi-Vendor Order Status Conflict & Mutation Leaks
- **Severity:** **HIGH**
- **Location:** [`amar-shop-server/src/app/modules/Vendor/vendor.sevices.ts#L122-L148`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Vendor/vendor.sevices.ts#L122-L148)
- **Problem:** `updateOrderStatusIntoDB` updates `prisma.order.update({ where: { id: orderId }, data: { status } })`. If an order contains items from two different vendors, Vendor A changing status to `DELIVERED` marks Vendor B's items as `DELIVERED` too.
- **Remediation:** Decouple order fulfillment status to the `OrderItem` level or introduce a `VendorOrder` sub-order model representing the vendor's slice of an order.

### 6. Defective Global Error Handler Forcing HTTP 500 on All Errors
- **Severity:** **HIGH**
- **Location:** [`amar-shop-server/src/app/middlewares/globalErrorHandler.ts#L11-L37`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/middlewares/globalErrorHandler.ts#L11-L37)
- **Problem:** `globalErrorHandler` initializes `statusCode = 500`. It catches Prisma errors, but treats all generic `Error` and `AppError` instances uniformly without checking `err.statusCode`. Consequently, authentication failures, bad input, and 404s all return HTTP 500.
- **Remediation:** Support `AppError` and `ZodError` explicitly:
  ```typescript
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation Error";
    error = err.issues;
  }
  ```

### 7. Severe Frontend N+1 Query on Catalog Product Cards
- **Severity:** **HIGH**
- **Location:** [`amar-shop-client/src/components/product/ProductCard.tsx#L55`](file:///f:/web%20development/RePolish/amar-shop-client/src/components/product/ProductCard.tsx#L55)
- **Problem:** Every `ProductCard` component independently executes `useGetReviewsSingleProductQuery(product.id)`. Browsing a page with 30 products fires 30 extra HTTP queries to the backend.
- **Remediation:** Calculate average rating and review counts on the server within `getAllProductsFromDB` using Prisma `_avg` and `_count` aggregations and return them directly on the product model.

### 8. Exposed Production Secrets on Disk & Neon Shadow DB Usage
- **Severity:** **HIGH**
- **Location:** [`amar-shop-server/.env#L1-L25`](file:///f:/web%20development/RePolish/amar-shop-server/.env#L1-L25)
- **Problem:** `.env` file contains plaintext Neon PostgreSQL credentials, Cloudinary secrets, and Gmail App Password. Furthermore, the active connection string points to a migration shadow database (`prisma_migrate_shadow_db_...`).
- **Remediation:** Immediately rotate all compromised credentials (database, Cloudinary, Gmail). Update `DATABASE_URL` to point to the primary application database pooler, and supply environment variables via Vercel dashboard rather than physical `.env` files on disk.

### 9. Price, Tax & Shipping Discrepancy Between Client and Server
- **Severity:** **MEDIUM**
- **Location:** [`amar-shop-server/src/app/modules/Customer/customer.services.ts#L64-L77`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/Customer/customer.services.ts#L64-L77), [`amar-shop-client/src/pages/customerPages/CheckoutPage.tsx#L48-L53`](file:///f:/web%20development/RePolish/amar-shop-client/src/pages/customerPages/CheckoutPage.tsx#L48-L53)
- **Problem:** The client calculates 5% VAT and $15 shipping fee. The backend checkout service calculates `subtotal - couponDiscount` and completely omits both shipping fee and VAT. The amount billed via SSLCommerz differs from the checkout invoice shown to the customer.
- **Remediation:** Synchronize the price calculation formula. Centralize tax and shipping calculation on the backend and expose an order pre-calculation endpoint for the frontend.

### 10. Redux Reducer Throwing Exceptions & Misplaced Middleware Order
- **Severity:** **MEDIUM**
- **Location:** [`cartSlice.ts#L32-L34`](file:///f:/web%20development/RePolish/amar-shop-client/src/redux/features/cartSlice.ts#L32-L34), [`user.routes.ts#L16-L17`](file:///f:/web%20development/RePolish/amar-shop-server/src/app/modules/User/user.routes.ts#L16-L17)
- **Problem:** Reducers must be pure and never throw. Throwing `new Error("DIFFERENT_VENDOR_DETECTED")` violates Redux core contracts. Additionally, in `user.routes.ts`, `validateRequest` runs before `parseBody`, breaking multipart JSON validation.
- **Remediation:** Handle vendor conflicts using standard Redux state flags (`state.conflictItem = product`) instead of throwing errors. Reorder middleware in `user.routes.ts` so `parseBody` precedes `validateRequest`.

---

## 12. ARCHITECTURAL SCORECARD

| Dimension | Score (1-10) | Concise Justification |
|---|:---:|---|
| **Architecture** | **5 / 10** | Clean folder organization and modular separation, but marred by foreign keys on natural email keys, lack of multi-vendor sub-orders, and Redux reducer exception throwing. |
| **Code Quality** | **4 / 10** | High volume of orphaned dead code components, extensive `any` types, pervasive copy-paste errors in controllers, and file/variable naming typos. |
| **Security** | **2 / 10** | Crippled by critical privilege escalation to ADMIN, 100% payment bypass in callback handlers, widespread IDOR on product/shop edits, and exposed disk secrets. |
| **Scalability** | **3 / 10** | Sabotaged by frontend N+1 query loops on product cards, unpaginated core listing endpoints, in-memory aggregation of analytics, and disabled RTK Query caching. |
| **Testing** | **1 / 10** | Completely absent. 0 unit tests, 0 integration tests, 0 E2E tests, and no test scripts configured in package.json. |
| **Documentation** | **6 / 10** | Comprehensive README files with setup guides, but they assert false security claims ("zero-trust payment") and describe dead or orphaned features. |
| **Production Readiness** | **2 / 10** | Unsafe for production deployment in its current state due to critical authentication, authorization, and financial payment bypass vulnerabilities. |

---

## 13. PRIORITIZED REMEDIATION ROADMAP

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 1: EMERGENCY SECURITY HOTFIXES                 │
│  - Restrict `/api/auth/register` to VENDOR & CUSTOMER (Block ADMIN)    │
│  - Eliminate payment bypass in `confirmationService` & enforce IPN     │
│  - Implement vendor ownership checks on product & shop update/delete   │
│  - Rotate exposed Neon DB, Cloudinary, and Gmail credentials           │
│  - Fix broken IDOR validation in `resetPassword`                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                PHASE 2: RELATIONAL INTEGRITY & CORE REPAIR             │
│  - Refactor Prisma FKs to target `User.id` (UUID) instead of `email`   │
│  - Add `VendorOrder` model to prevent multi-vendor status overwrites   │
│  - Fix `globalErrorHandler` to preserve `AppError` status codes        │
│  - Correct middleware ordering in `user.routes.ts` (`parseBody` first) │
│  - Fix `Shop.logoUrl` field mutation crash in `updateShopIntoDB`       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               PHASE 3: PERFORMANCE & ARCHITECTURAL REFACTOR            │
│  - Eliminate ProductCard N+1 query by aggregating ratings on backend   │
│  - Add server-side pagination to users, transactions, shops, and orders│
│  - Migrate in-memory revenue calculations to SQL `SUM` / `GROUP BY`    │
│  - Remove `keepUnusedDataFor: 0` to restore RTK Query caching          │
│  - Refactor `cartSlice.ts` to remove `throw new Error` inside reducer  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  PHASE 4: TESTING, CLEANUP & DEVOPS                    │
│  - Purge orphaned dead code (`RevenueChart`, `TotalShopCard`, etc.)     │
│  - Implement automated test suite (Jest / Supertest / Vitest)          │
│  - Establish GitHub Actions CI pipeline for linting, build, and tests  │
│  - Introduce Docker Compose for local database orchestration           │
│  - Add structured logging via Pino or Winston                          │
└────────────────────────────────────────────────────────────────────────┘
```

---
*Report compiled autonomously following thorough static inspection of all client and server source files.*
