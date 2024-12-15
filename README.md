
# E-commerce System Server

It's a backend based library management server which is connected to postgres database. We can create member,create book and borrow record, update our data through this server.

## Project Name:

Amar Shop

## Live URL:

- [Amar Shop API](https://amar-shop-server-one.vercel.app)

## Features:

### Member:
- Create Customer
- Create Vendor
- Update Member
- Delete Member
- Get Member
- Reset Pass via email
### Shop
- Create Shop
- Update Shop
- Delete Shop
- Get Shop
### Product
- Create Product
- Update Product
- Delete Product
- Get Product
## Payment Gateway
- Amar Pay
## Extra Feature:
- Infinite Scroll



## Technology Used

- **bcrypt**: A library to help hash passwords, ensuring secure storage of user passwords in databases.

- **cookie-parser**: Middleware for handling cookies in Express.js applications, allowing easy parsing and manipulation of cookies.

- **cors**: Middleware for enabling Cross-Origin Resource Sharing (CORS) in Express.js, allowing your server to accept requests from different origins.

- **dotenv**: A module that loads environment variables from a `.env` file into `process.env`, facilitating the configuration of environment-specific variables.

- **express**: A fast, unopinionated, minimalist web framework for Node.js, used for building web applications and APIs.

- **http-status**: A utility to interact with HTTP status codes, providing constants and descriptions for standard HTTP status codes.

- **jsonwebtoken**: A library to create, sign, and verify JSON Web Tokens (JWTs), commonly used for authentication in web applications.

- **prisma**: Prisma is an open-source ORM (Object-Relational Mapping) tool for Node.js and TypeScript that simplifies database interactions with a type-safe and intuitive API. It supports popular databases like PostgreSQL, MySQL, and MongoDB, making it easy to perform CRUD operations and manage schema migrations.

- **ts-node-dev**: A development tool that combines `ts-node` with `nodemon`, enabling automatic restarts and TypeScript compilation for faster development cycles.

- **typescript**: A strongly typed programming language that builds on JavaScript, adding static type definitions to help catch errors early in the development process.

- **postgres**: PostgreSQL, commonly known as Postgres, is a powerful, open-source relational database system known for its robustness, scalability, and support for complex queries. It offers advanced features like JSON support, full-text search, and ACID compliance, making it ideal for handling large, data-intensive applications.

- **Cloudinary**: It's file deployment site for uploading image online.

## Installation

To set up the project locally, follow these steps:

**1. Clone the repository**:

```bash
    git clone https://github.com/Utsho11/amar-shop-server.git
```

**2. Go to the project directory:**

Please change my-project with the main directory here. 

```bash
    cd my-project
```
 

**3. Install dependencies**:

Open your terminal and run these commands to set npm.

```bash
    1. npm init -y
    
    2. npm install
```

**4. Set up environment variables**:

Create a `.env` file in the root of the project and add the following variables:
```bash
DATABASE_URL
NODE_ENV
PORT
ACCESS_SECRET
REFRESH_SECRET
ACCESS_SECRET_EXPIRE
REFRESH_SECRET_EXPIRE
RESET_PASS_SECRET
RESET_PASS_SECRET_EXPIRE_IN
RESET_PASS_LINK
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SENDER_EMAIL
SENDER_APP_PASS
ADMIN_EMAIL
ADMIN_PASS
STORE_ID
SIGNATURE_KEY
PAYMENT_URL
SEARCH_URL
```

**5. Run the application**:

```bash
    npm run dev
```
