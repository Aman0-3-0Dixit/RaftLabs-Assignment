# OrderRail — Order Management

A menu-browsing, cart, checkout, and live order-tracking feature for a food
delivery app. Next.js 14 (App Router) + Prisma/Postgres + TDD throughout.

## Stack

- **Next.js 14** (App Router) — frontend and API routes in one codebase
- **Prisma + PostgreSQL** (designed for [Neon](https://neon.tech))
- **Zod** — runtime validation, shared between client and server
- **Vitest + React Testing Library** — TDD across engine, handlers, routes, and components
- **react-window** — virtualized menu grid
- **next/image** — lazy-loaded, responsive menu images
- **Tailwind CSS** — styling, with a custom "kitchen ticket" design system

## Getting started

```bash
npm install
npx prisma generate      # generates the Prisma Client from prisma/schema.prisma
npx prisma migrate dev   # creates the schema in your database
npx prisma db seed       # loads the menu
npm run dev
```


```bash
npm test        # run the full test suite once
npm run test:watch
npm run build    # production build
```
