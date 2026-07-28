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
| **Google** | Yes | Select support email |
| **Phone (SMS OTP)** | Yes | Enable + set test numbers |
| **Anonymous** | Yes | Just enable |

3. For **Google Sign-In**:
   - Select a **support email** from your project
   - The authorized domains are auto-configured

4. For **Phone Auth**:
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
3. Choose **Start in test mode** (for development)
4. Select a location (e.g. `eur3` for Europe)
5. Later, add security rules for production

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
gh secret set NEXT_PUBLIC_APP_VERSION                -b "0.2.1"
gh secret set NEXT_PUBLIC_APP_BUILD                  -b "2"

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

## 11. Security Rules (Production)

After development, switch from test mode to proper security rules:

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public readable collections
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Admin-only collections
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /roles/{roleId} {
      allow read: if request.auth != null;
      allow write: if false; // Only via Admin SDK
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload
    match /uploads/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public avatars
    match /avatars/{avatarId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
