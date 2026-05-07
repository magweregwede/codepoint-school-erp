import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@prisma/config';

// Prisma CLI doesn't read .env.local automatically. Load both, with .env.local
// taking precedence so local dev URLs can override anything checked into .env.
loadEnv({ path: '.env.local', override: true });
loadEnv({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
