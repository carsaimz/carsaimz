# Auth System Overhaul - Work Record

## Task Summary
Overhauled the authentication system for the Carsai Mozambique platform, replacing demo-based auth with real database-backed authentication.

## Changes Made

### 1. Registration API Endpoint (`/api/auth/register/route.ts`)
- Created POST endpoint that creates real User records via Prisma
- Accepts: name, email, password, phone (optional)
- Validates email uniqueness (409 on duplicate)
- Validates email format and password minimum length (8 chars)
- Uses SHA256 hashing for password (can be upgraded later)
- Assigns 'user' role by default
- Returns user data on success

### 2. Login API Endpoint (`/api/auth/login/route.ts`)
- Created POST endpoint for real authentication
- Accepts: login (email or phone), password
- Detects whether login value is email or phone (based on '@' character)
- Looks up user by email OR phone
- Validates password against stored passwordHash
- Checks if user account is active
- Returns user data on success, proper error codes on failure (401, 403)

### 3. Auth Store (`/lib/store.ts`)
- Removed ALL DEMO_USERS constant and related code
- Removed loginAsDemo function entirely
- Updated login() to call real `/api/auth/login` endpoint
- Updated register() to call `/api/auth/register` endpoint (now async, returns Promise<boolean>)
- Added isLoading state
- Changed login signature: `(login: string, password: string)` instead of `(email: string, password: string)`
- Changed register signature: `(name, email, password, phone?)` instead of `(name, email, password)`

### 4. Auth Context (`/contexts/auth-context.tsx`)
- Removed loginAsDemo from context interface and implementation
- Removed DEMO_USERS import and references
- Added isLoading to context interface
- Updated register to match store's async signature

### 5. Auth Page (`/app/(public)/auth/page.tsx`)
- Created dedicated auth page (not modal)
- Carsai logo prominently displayed at top using `/public/logo.png`
- Clean, centered layout with login/register tabs
- No demo/test account buttons or mentions
- Show/hide password toggle (Eye/EyeOff icons) for login and register forms
- Login supports email OR phone number (toggle to switch between)
- Register has: full name, email, password (with show/hide), confirm password (with show/hide), phone (optional)
- Full i18n support using useLanguage()
- After successful login/register, redirect based on role
- Link to /home for "back to home"
- Toast notifications for success/error

### 6. Login Modal (`/components/common/login-modal.tsx`)
- Removed ALL demo account buttons and related code
- Removed demoLoading state
- Removed handleDemoLogin function
- Removed "Demo accounts for testing" sections
- Removed placeholder text showing demo credentials ("admin@carsai.mz", "demo123")
- Added show/hide password toggle to login form (Eye/EyeOff icons)
- Added show/hide password toggle to register form
- Added confirm password field to register form
- Added phone field to register form (optional)
- Added login mode toggle (email vs phone)
- Toast notifications for success/error

### 7. User Settings (`/components/user/user-settings.tsx`)
- Added show/hide password toggle for password change fields
- Changed "Phone" label to use t('auth.phone')
- Changed all labels to use t() translations
- Made save button call `/api/user/profile` PUT endpoint with real data
- Added success/error toast notifications via sonner
- Added password change section with validation
- Updated store after save to reflect changes

### 8. Profile API (`/api/user/profile/route.ts`)
- Added support for newPassword field in PUT handler
- Password updates use SHA256 hashing (same as auth routes)
- Validates minimum password length (8 chars)

### 9. Public Header (`/components/layout/public-header.tsx`)
- Changed auth buttons to link to /auth page instead of opening modal
- Removed LoginModal import and usage (modal no longer needed from header)
- Desktop Login/Register buttons now link to /auth
- Mobile menu Login/Register buttons now link to /auth

### 10. i18n Keys Added
Added new translation keys to all 6 language files (en-us, pt-pt, es-es, fr-fr, zh-cn, de-de):
- auth.phoneRequired
- auth.fullNameRequired
- auth.optional
- auth.backToHome
- auth.passwordUpdateFailed
- auth.emailAlreadyExists
- dashboard.settingsDesc
- dashboard.profileInfo
- dashboard.address
- dashboard.changePassword
- dashboard.saving
- dashboard.saveChanges
- dashboard.profileSaved

## Verification
- Lint passes cleanly (no errors)
- Auth page returns 200 status code
- Register endpoint creates real users in database
- Login endpoint works with both email and phone
- Duplicate email registration returns 409 error
- Wrong password login returns 401 error
- No references to DEMO_USERS or loginAsDemo remain in src/
- No demo credentials (admin@carsai.mz, demo123) in auth-related code
