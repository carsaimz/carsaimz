# Firebase Setup Guide — Carsai Mozambique

This guide covers everything you need to configure Firebase for the Carsai Mozambique app.

---

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it `carsai-mozambique` (or your preferred name)
4. Disable Google Analytics if you want, or enable it (free)
5. Click **Create project**

---

## 2. Register Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Register app name: `Carsai Mozambique`
3. Check **"Also set up Firebase Hosting"** if you want hosting (optional)
4. Copy the `firebaseConfig` object — you'll need these values:
   ```
   apiKey
   authDomain
   projectId
   storageBucket
   messagingSenderId
   appId
   measurementId
   ```

### Where the config goes

The Firebase client config uses **env vars with hardcoded fallbacks**:

- **`src/lib/client-config.ts`** — `FIREBASE_CONFIG` object uses `process.env.NEXT_PUBLIC_FIREBASE_* || hardcoded_fallback`
- **CI workflows** — inject env vars from GitHub Secrets to override fallbacks
- **Local dev** — hardcoded fallbacks work without `.env`

If you want to override the hardcoded values (e.g. for a different Firebase project), set these env vars:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

---

## 3. Enable Authentication Providers

1. Go to **Authentication** → **Sign-in method**
2. Enable each provider you want:

| Provider | Free on Spark? | Setup Required |
|----------|---------------|----------------|
| **Email/Password** | Yes | None — just enable |
| **Google** | Yes | Select support email + SHA-1 fingerprint |
| **GitHub** | Yes | Create GitHub OAuth App |
| **Phone (SMS OTP)** | Yes | Enable + set test numbers |
| **Anonymous** | Yes | Just enable |

3. For **Google Sign-In** (critical for Android app):
   - Select a **support email** from your project
   - The authorized domains are auto-configured
   - **IMPORTANT**: Add the SHA-1 fingerprint of your Android signing certificate
     - Go to **Project Settings** → Your Android app → **Add fingerprint**
     - Debug SHA-1: Run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
     - Release SHA-1: Run `keytool -list -v -keystore upload/release.jks -alias carsai`
     - **Without the SHA-1 fingerprint, Google Sign-In will NOT work in the Android app**

4. For **GitHub Sign-In**:
   - Create a GitHub OAuth App at https://github.com/settings/developers
   - Set the **Authorization callback URL** to: `https://carsai-mozambique-d5983.firebaseapp.com/__/auth/handler`
   - Copy the **Client ID** and **Client Secret** into Firebase Console → Authentication → GitHub provider

5. For **Phone Auth**:
   - Enable it
   - Add **test phone numbers** and **test verification codes** for development
   - Example: `+258847545020` → code `123456`

---

## 4. Create Service Account (Admin SDK)

The Firebase Admin SDK is used in server-side API routes and seed scripts.

1. Go to **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (keep it secure — never commit it)
4. Extract these 3 values from the JSON:

| Field | JSON key | Env var |
|-------|---------|---------|
| Project ID | `project_id` | `FIREBASE_ADMIN_PROJECT_ID` |
| Client email | `client_email` | `FIREBASE_ADMIN_CLIENT_EMAIL` |
| Private key | `private_key` | `FIREBASE_ADMIN_PRIVATE_KEY` |

### Set as GitHub Secrets

```bash
gh secret set FIREBASE_ADMIN_PROJECT_ID -b "carsai-mozambique-d5983"
gh secret set FIREBASE_ADMIN_CLIENT_EMAIL -b "firebase-adminsdk-xxxxx@carsai-mozambique-d5983.iam.gserviceaccount.com"
gh secret set FIREBASE_ADMIN_PRIVATE_KEY -b "$(cat service-account.json | jq -r '.private_key')"
```

### Set for local development

Create `.env.local` (gitignored):
```bash
FIREBASE_ADMIN_PROJECT_ID=carsai-mozambique-d5983
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@carsai-mozambique-d5983.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

---

## 5. Configure Cloud Messaging (FCM)

### Web Push (VAPID Key)

1. Go to **Project Settings** → **Cloud Messaging**
2. Under **Web Push certificates**, generate a new VAPID key
3. Copy the key string — it goes in:
   - `src/lib/client-config.ts` as `FIREBASE_VAPID_KEY` fallback
   - GitHub Secret `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Android Push

1. The `google-services.json` file in `android/app/` already contains the Android FCM config
2. No additional setup needed for Android push notifications

---

## 6. Configure Cloud Storage

1. Go to **Storage** in Firebase Console
2. Click **"Get started"**
3. Choose **Start in test mode** (for development)
4. Select a location (e.g. `eur3` for Europe, or closest to Mozambique)
5. Later, add security rules for production

---

## 7. Configure Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click **"Create database"**
3. Choose **Start in test mode** (for development — allows all reads/writes)
4. Select a location (e.g. `eur3` for Europe)

### Deploy Firestore Security Rules

The project includes a `firestore.rules` file that should be deployed to Firebase:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

**IMPORTANT**: If you chose "Start in test mode" when creating the database, Firebase uses default rules that expire after 30 days. Deploy the project's `firestore.rules` file before the test mode expires, otherwise all client-side Firestore operations will fail.

### About the Firestore Rules

The `firestore.rules` file in this project:
- **Public reads** on: `roles`, `settings`, `categories`, `forum_categories`, `services`, `projects`, `testimonials`, `posts`, `tags`, `post_tags`, `comments`, `forum_topics`, `forum_posts`, `forum_likes`, `pages` — these are needed so the app can display content even without authentication, and so the seed check (`isDatabaseSeeded()`) can work before the user signs in.
- **Authenticated reads/writes** on: `users`, `quotes`, `proposals`, `payments`, `invoices`, `notifications`, `support_tickets`, etc.
- **Public writes allowed** on: `subscribers` (newsletter), `affiliate_clicks` — for anonymous subscription/click tracking

### Firestore Collections

The app uses these collections (created by the seed script):

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles |
| `roles` | Role definitions (super_admin, admin, partner, user) |
| `permissions` | Permission definitions |
| `role_permissions` | Role-permission mappings |
| `settings` | Site settings (company name, emails, phones, social) |
| `posts` | Blog posts |
| `categories` | Content categories |
| `tags` | Content tags |
| `projects` | Portfolio projects |
| `services` | Business services |
| `testimonials` | Client testimonials |
| `forum_categories` | Forum categories |
| `forum_topics` | Forum topics |
| `forum_posts` | Forum posts/replies |
| `forum_likes` | Forum likes |
| `invoices` | Invoices |
| `invoice_items` | Invoice line items |
| `payments` | Payment records |
| `quotes` | Client quotes |
| `proposals` | Business proposals |
| `support_tickets` | Support tickets |
| `ticket_replies` | Ticket replies |
| `notifications` | User notifications |
| `subscribers` | Newsletter subscribers |
| `logs` | System audit logs |
| `pages` | Site pages |
| `file_attachments` | File attachments |
| `ai_providers` | AI provider configs |

---

## 8. Seed the Database

After Firebase is configured, run the seed script to populate initial data:

```bash
# Make sure FIREBASE_ADMIN_* vars are set in .env.local
bun run firebase:init    # Test connection first
bun run firebase:seed    # Seed roles, permissions, users, settings
```

The seed creates:
- **4 roles**: super_admin, admin, partner, user
- **22 permissions**: manage_posts, manage_users, etc.
- **2 users**: 
  - `carsaimozambique@gmail.com` (super_admin) — password: `Carnanda23`
  - `suporte.carsaimz@gmail.com` (admin) — password: `CarsaiAdmin2025`
- **17 settings**: company name, emails, phones, social media, M-Pesa number

---

## 9. All GitHub Secrets Reference

Set all these secrets in your GitHub repository:

```bash
# Firebase Client SDK (override hardcoded fallbacks)
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY           -b "AIzaSy..."
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN       -b "carsai-mozambique-d5983.firebaseapp.com"
gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID        -b "carsai-mozambique-d5983"
gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET    -b "carsai-mozambique-d5983.firebasestorage.app"
gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID -b "136334398331"
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID            -b "1:136334398331:web:4a81fc..."
gh secret set NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID    -b "G-4P1J5KZHXF"
gh secret set NEXT_PUBLIC_FIREBASE_VAPID_KEY         -b "BOWPwKVMZEKR..."

# Optional: API URL for mobile app
gh secret set NEXT_PUBLIC_API_URL                    -b "https://carsai.mz"

# Optional: App version overrides
gh secret set NEXT_PUBLIC_APP_VERSION                -b "1.0.0"
gh secret set NEXT_PUBLIC_APP_BUILD                  -b "1"

# Firebase Admin SDK (truly secret — server-side only)
gh secret set FIREBASE_ADMIN_PROJECT_ID              -b "carsai-mozambique-d5983"
gh secret set FIREBASE_ADMIN_CLIENT_EMAIL            -b "firebase-adminsdk-xxxxx@carsai-mozambique-d5983.iam.gserviceaccount.com"
gh secret set FIREBASE_ADMIN_PRIVATE_KEY             -b "$(cat service-account.json | jq -r '.private_key')"

# Android Keystore (base64-encoded .jks file)
# First encode your keystore: base64 -w 0 release.jks > keystore_b64.txt
gh secret set KEYSTORE_FILE                          -b "$(cat keystore_b64.txt)"
gh secret set KEYSTORE_PASSWORD                      -b "your-keystore-password"
gh secret set KEYSTORE_ALIAS                         -b "your-key-alias"
gh secret set KEY_PASSWORD                           -b "your-key-password"
```

---

## 10. Android Keystore Setup

### Generate a keystore

```bash
keytool -genkeypair -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD
```

### Encode for GitHub Secret

```bash
base64 -w 0 release.jks > keystore_b64.txt
gh secret set KEYSTORE_FILE -b "$(cat keystore_b64.txt)"
gh secret set KEYSTORE_PASSWORD -b "YOUR_PASSWORD"
gh secret set KEYSTORE_ALIAS -b "release"
gh secret set KEY_PASSWORD -b "YOUR_PASSWORD"
```

The CI workflow decodes `KEYSTORE_FILE` and creates `keystore.properties` for Gradle signing automatically.

---

## 12. Android google-services.json

**CRITICAL**: The `google-services.json` file must be downloaded from the Firebase Console with the correct OAuth client IDs and SHA-1 fingerprint. The placeholder file in the repo will NOT work for Google Sign-In.

### Steps:
1. Go to **Project Settings** → Your Android app (`com.carsaimz`)
2. Make sure you have added the **SHA-1 fingerprint** of your signing certificate
3. Click **Download google-services.json**
4. Replace the file at `android/app/google-services.json` with the downloaded file
5. **DO NOT commit the real google-services.json to GitHub** — add it to `.gitignore` and use the CI workflow to inject it

### The CI workflow handles this automatically:
- The `android-build.yml` workflow downloads `google-services.json` from GitHub Secrets
- The secret name is `GOOGLE_SERVICES_JSON` (the JSON content, base64-encoded)
- To set it: `gh secret set GOOGLE_SERVICES_JSON -b "$(base64 -w 0 android/app/google-services.json)"`

---

## 13. Troubleshooting Common Issues

### "Unexpected token '<'" error on Blog/Forum pages
- **Cause**: The API route returns HTML (404 page) instead of JSON
- **Fix**: This is handled automatically by the `fetchWithFallback` function — it falls back to client-side Firestore. If the database is empty, the pages will show "No posts" / "No topics" instead of crashing.
- **Make sure**: Firestore security rules are deployed (Section 7) and the database is seeded (Section 8)

### Account creation fails (Auth succeeds but Firestore write fails)
- **Cause**: Firestore security rules block client-side writes
- **Fix**: Deploy the `firestore.rules` file (Section 7). The rules allow authenticated users to create their own profile in the `users` collection.

### Google Sign-In doesn't work in the Android app
- **Cause 1**: The `google-services.json` has placeholder values instead of real OAuth client IDs
- **Fix 1**: Download the correct `google-services.json` from Firebase Console (Section 12)
- **Cause 2**: The SHA-1 fingerprint of the signing certificate is not added to Firebase
- **Fix 2**: Add the SHA-1 fingerprint in Firebase Console → Project Settings → Your Android app → Add fingerprint (Section 3)

### GitHub Sign-In shows Portuguese text in English mode
- **Cause**: This was a translation bug that has been fixed. The `signInWithGithub` key is now correctly translated in all 7 language files.
- **If still occurring**: Clear browser cache and hard-refresh the page

### Database is empty (no collections)
- **Cause**: Firestore was created but not seeded
- **Fix**: Use the `/setup` page (http://localhost:3000/setup) to create a super admin and seed the database. Or use the `DatabaseSetup` component that auto-detects an empty database and prompts you to seed.

### Firestore Security Rules expire after 30 days
- **Cause**: "Start in test mode" rules expire after 30 days
- **Fix**: Deploy the project's `firestore.rules` file (Section 7) before the test mode expires
