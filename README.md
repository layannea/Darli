# Darli

Darli is a web app for landlord / property manager and tenant payment.

Users can:
- sign up or log in
- choose a role during signup (`landlord` or `tenant`)
- access their dashboard after authentication
- landlords can add buildings, units, and tenants
- tenants can connect with landlords and manage unit-related requests
- tenants can pay rent directly to the property manager

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- SQLite
- Node.js

## Prerequisites

Make sure you have the following installed:

- Node.js 18 or later
- npm 9 or later

## Project Setup

### 1. Clone the repository

```bash
git clone git@github.com:layannea/Darli.git
cd Darli
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Create a `.env` file in the project root with:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace_with_a_long_random_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
```

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Create the local database

```bash
npx prisma migrate dev --name init
```

### 6. Start the development server

```bash
npm run dev
```

Then open:

```txt
http://localhost:3000
```

## Database

This project uses SQLite locally through Prisma.

The local database file is stored at:

```txt
prisma/dev.db
```

### Inspect the database

```bash
npx prisma studio
```

### Reset the local database

```bash
rm -f prisma/dev.db
rm -f prisma/dev.db-journal
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

If you reset the database, clear your browser cookies or log out so stale local sessions do not cause routing issues.

## Useful Commands

### Start the dev server

```bash
npm run dev
```

### Generate Prisma client

```bash
npx prisma generate
```

### Open Prisma Studio

```bash
npx prisma studio
```

### Create and apply a migration

```bash
npx prisma migrate dev --name <migration_name>
```

### Reset the database

```bash
npx prisma migrate reset
```

