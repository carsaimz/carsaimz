---
Task ID: 1
Agent: Main Agent
Task: Firebase migration — fill credentials, add Phone Auth, fix auth context, update UI

Work Log:
- Explored full codebase — Firebase structure already exists (firebase-client.ts, firebase-admin.ts, db.ts, fcm.ts, serialize.ts)
- Updated .env with actual Firebase client SDK credentials from user (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId)
- Created android/app/google-services.json with user-provided Android config (package_name: com.carsaimz)
- Updated firebase-client.ts — added Analytics, Firestore client, Firebase Storage, FCM token request, foreground message listener, RecaptchaVerifier for phone auth, PhoneAuthProvider
- Updated client-config.ts — added phoneSignIn=true, emailSignIn=true, cloudStorage=true, remoteConfig=true, appCheck=true, crashlytics=true, performanceMonitoring=true
- Fixed auth-context.tsx — added onAuthStateChanged listener for session persistence, exposed all auth methods (loginWithEmailPassword, loginWithGoogle, loginAnonymously, loginWithPhone, verifyPhoneCode), added backward-compat login method
- Updated store.ts — added loginWithPhone (SMS OTP step 1), verifyPhoneCode (SMS OTP step 2), phoneVerificationId state, fixed register to not send password to server (Firebase Auth handles passwords)
- Rewrote scripts/seed.js — replaced Prisma/MySQL with a pointer to firebase-seed.js (which already exists and works)
- Installed @capacitor-firebase/authentication@8.3.0 and @capacitor-firebase/messaging@8.3.0
- Fixed login-modal.tsx — updated to use loginWithEmailPassword instead of nonexistent login(), added Google Sign-In button, Anonymous Sign-In button, Phone Auth (SMS OTP) with reCAPTCHA container
- Fixed auth page.tsx — updated to use store.loginWithEmailPassword, store.register, store.loginWithGoogle, store.loginAnonymously; added social login buttons (Google + Anonymous) with separator
- Fixed fr-fr.ts translation file — escaped apostrophe in l'authentification that was breaking build
- Build successful: 34 HTML pages, 406 files in output directory

Stage Summary:
- Firebase client SDK credentials fully configured with real values
- google-services.json created in android/app/
- All 4 free auth methods implemented: Email/Password, Google, Phone (SMS OTP), Anonymous
- Auth context and store properly expose all login methods
- Login modal and auth page updated with social login buttons
- FCM (push notifications) infrastructure ready (client token request + server messaging)
- Firebase Analytics, Cloud Storage, Firestore client all initialized
- Build compiles successfully (34 pages, 406 files)
- Still needs: FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY (service account key) for server-side API routes to work
- Still needs: NEXT_PUBLIC_FIREBASE_VAPID_KEY for FCM web push notifications
