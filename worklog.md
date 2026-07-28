---
Task ID: 1
Agent: Super Z (main)
Task: Migrate Carsai Mozambique from SQLite/Supabase to MySQL (Prisma)

Work Log:
- Changed prisma/schema.prisma: provider from "sqlite" to "mysql", added @db.VarChar, @db.Text, @db.LongText annotations for MySQL column types
- Updated .env: DATABASE_URL changed from SQLite format to mysql://if0_38218178:carnanda23@sql109.infinityfree.com:3306/if0_38218178_csmz
- Rewrote src/app/api/auth/register/route.ts: uses Prisma + MySQL directly (no Supabase)
- Rewrote src/app/api/auth/login/route.ts: uses Prisma + MySQL directly (no Supabase)
- Rewrote src/lib/store.ts: removed Supabase client-side auth imports, uses API routes only
- Rewrote src/lib/client-config.ts: removed SUPABASE_URL/SUPABASE_ANON_KEY/isSupabaseAnonKeyValid, kept SITE_URL/GITHUB_URL/API_BASE_URL/FEATURES
- Deleted src/lib/supabase.ts entirely
- Updated src/lib/db.ts: removed Supabase references in comments, simplified Prisma client (no log: ['query'])
- Updated package.json: removed @supabase/supabase-js, added mysql2@^3.11.0
- Created prisma/seed.ts for MySQL
- Updated scripts/seed.js for MySQL
- Updated translations: replaced "PostgreSQL" with "MySQL" in all 7 language files
- Generated Prisma Client successfully
- Build succeeded: 402 files, 34 HTML pages

Stage Summary:
- MySQL migration complete in code — Prisma schema, auth routes, store, client-config all updated
- Supabase completely removed from the project
- Build compiles and exports successfully
- Note: InfinityFree MySQL server (sql109.infinityfree.com) is NOT reachable remotely — this is a known limitation of free hosting that restricts external MySQL access
- The user will need to either: (a) enable remote MySQL from InfinityFree panel, or (b) use a different MySQL host that allows remote connections, or (c) deploy the Next.js backend on InfinityFree's PHP hosting with MySQL accessible locally
