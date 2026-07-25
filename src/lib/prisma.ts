import { PrismaClient } from "@/generated/prisma/client"; 


// import { PrismaClient } from "@prisma/client"; //commenting this out, reason explained in info.txt
// console.log("ENV:", process.env.POSTGRES_PRISMA_URL);
// console.log("ENV:", process.env.DATABASE_URL);

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;


/*
This is a Prisma singleton pattern and it's specifically needed for Next.js development mode. The goal is to prevent multiple database connections during development.

In Next.js dev mode, every time you save a file, Next.js does hot reload. Without this pattern, each reload creates a new PrismaClient instance, and each instance opens its own database connection pool.
So after 10 reloads → 10 connection pools → Neon/Postgres throws a "too many connections" error and your app breaks.


1. Creating the Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient(); // creates the actual DB client
};
This is your connection to the database. Without this, you can't query anything.

2. Making it a Global Singleton,  Declares a global variable to hold the instance
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// 3. Reuse existing instance if it exists, otherwise create new one
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
If a global Prisma client exists → reuse it
Else → create a new one

4. In development, save the instance to global so hot reloads reuse it
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
This ensures only one instance exists across the entire app, surviving hot reloads.
Why Production Doesn't Need It?
In production (like Vercel):
process.env.NODE_ENV === "production"
So the global variable isn't reused.
Production servers manage connections differently.


What happens if you remove it and just do this:
const prisma = new PrismaClient();
export default prisma;

In production → works fine, no hot reloads
In development → eventually crashes with too many DB connections

So Both things are happening in that one file:
1. Creating the Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient(); // creates the actual DB client
};
This is your connection to the database. Without this, you can't query anything.

2. Making it a Global Singleton
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
This ensures only one instance exists across the entire app, surviving hot reloads. You import the same single instance every time, from any file, and it's always the same one. That's the singleton pattern — one instance shared everywhere.
*/