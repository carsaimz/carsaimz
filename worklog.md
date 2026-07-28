---
Task ID: 2
Agent: Super Z (main)
Task: Migrate Carsai Mozambique from MySQL/Prisma to Firebase (Firestore + Auth + FCM + Analytics)

Work Log:
- Removed all Prisma/MySQL files (schema.prisma, db.ts, seed files, migrations, db directory)
- Removed @prisma/client, prisma, mysql2, next-auth from package.json
- Installed firebase@12.16.0 and firebase-admin@14.2.0
- Created src/lib/firebase-client.ts (client SDK for Firebase Auth in browser)
  - Supports: email/password, Google, Facebook, Twitter, GitHub, Microsoft, Apple, anonymous, phone
  - Exported all auth providers, functions, and types
- Created src/lib/firebase-admin.ts (server SDK for Admin Auth + Firestore + Messaging)
  - Uses modular imports (firebase-admin/app, auth, firestore, messaging)
  - Lazy initialization with env vars
- Created src/lib/db.ts (Firestore service layer replacing Prisma)
  - Generic CRUD: createDoc, getDoc, updateDoc, deleteDoc, getDocs, queryDocs, countDocs, etc.
  - Firestore Timestamp helpers
- Rewrote all 30+ API routes to use Firestore service functions
  - Replaced db.model.findMany → getDocs/queryDocs
  - Replaced db.model.findUnique → getDoc/getDocByField
  - Replaced db.model.create → createDoc/createDocWithId
  - Replaced db.model.update → updateDoc
  - Replaced db.model.delete → deleteDoc
  - Replaced db.model.count → countDocs
  - Replaced include/relation → separate getDoc calls per relation
- Created 5 auth endpoints:
  - /api/auth/register — Firebase Auth + Firestore profile creation
  - /api/auth/login — ID token verification + Firestore profile retrieval
  - /api/auth/social — Google/Facebook/Twitter/GitHub/Microsoft/Apple sign-in
  - /api/auth/anonymous — Anonymous guest sign-in
  - /api/auth/verify — ID token verification for stored auth state
- Rewrote src/lib/store.ts for Firebase Auth client-side
  - loginWithEmailPassword, loginWithGoogle, loginWithFacebook, loginWithGitHub, loginWithMicrosoft, loginWithApple, loginAnonymously
  - register (email/password via Firebase Auth client)
  - loginWithToken (pre-obtained ID token)
  - All auth methods verify with server via ID token
- Created src/lib/fcm.ts (Firebase Cloud Messaging)
  - sendPushNotification, sendBulkPushNotification, registerFCMToken, removeFCMToken
  - /api/fcm endpoint for token registration
- Created src/lib/serialize.ts (Firestore Timestamp → ISO string converter)
- Updated src/lib/client-config.ts — added FIREBASE_CONFIG, isFirebaseConfigured(), feature flags
- Created scripts/firebase-init.js — validates connection
- Created scripts/firebase-seed.js — seeds Firestore with roles, permissions, users, settings
- Updated .env with Firebase placeholders (NEXT_PUBLIC_FIREBASE_* and FIREBASE_ADMIN_*)
- Updated translations: MySQL → Firebase Firestore and Auth in all 7 language files
- Build succeeded: 403 files, 34 HTML pages

Stage Summary:
- Complete migration from MySQL/Prisma/Supabase to Firebase (Firestore + Auth + FCM)
- All 38 API routes rewritten
- 8 auth provider methods in store (email, Google, Facebook, GitHub, Microsoft, Apple, anonymous, phone)
- FCM push notifications ready (awaiting google-services.json)
- Firebase Admin credentials are placeholders — user needs to fill them in
- google-services.json placement directory prepared (android/app/)
