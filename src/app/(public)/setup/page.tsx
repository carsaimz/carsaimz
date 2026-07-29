'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Shield,
  UserPlus,
  Settings,
  ArrowRight,
  RefreshCw,
  Lock,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useLanguage } from '@/contexts/language-context';
import { seedInitialData as clientSeedInitialData, isDatabaseSeeded } from '@/lib/client-seed';
import { useAuthStore } from '@/lib/store';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

// Order: check → seed → admin → done
// Seed data FIRST so roles/permissions exist before admin creation
type SetupStep = 'check' | 'seed' | 'admin' | 'done';

interface FirestoreStatus {
  configured: boolean;
  connected: boolean;
  hasUsers: boolean;
  hasAdmin: boolean;
  hasData: boolean;
  collections: string[];
}

// ──────────────────────────────────────────────
// Setup Page Component
// ──────────────────────────────────────────────

export default function SetupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<SetupStep>('check');
  const [status, setStatus] = useState<FirestoreStatus>({
    configured: false,
    connected: false,
    hasUsers: false,
    hasAdmin: false,
    hasData: false,
    collections: [],
  });
  const [checking, setChecking] = useState(true);

  // Seed state
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const [seedResults, setSeedResults] = useState<Record<string, number>>({});

  // Admin form
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminError, setAdminError] = useState('');

  // ── Check Firestore status on mount ──
  useEffect(() => {
    checkFirestoreStatus();
  }, []);

  async function checkFirestoreStatus() {
    setChecking(true);
    try {
      const { isFirebaseConfigured } = await import('@/lib/client-config');
      const configured = isFirebaseConfigured();

      if (!configured) {
        setStatus({
          configured: false,
          connected: false,
          hasUsers: false,
          hasAdmin: false,
          hasData: false,
          collections: [],
        });
        setChecking(false);
        return;
      }

      const { firestoreClient } = await import('@/lib/firebase-client');

      if (!firestoreClient) {
        setStatus(prev => ({ ...prev, configured, connected: false }));
        setChecking(false);
        return;
      }

      const { collection, getDocs, query, limit, where, getDoc, doc } = await import('firebase/firestore');

      // Check collections
      const collectionsToCheck = ['users', 'services', 'categories', 'blog_posts', 'settings', 'roles', 'permissions'];
      const existingCollections: string[] = [];

      for (const colName of collectionsToCheck) {
        try {
          const colRef = collection(firestoreClient, colName);
          const snap = await getDocs(query(colRef, limit(1)));
          if (!snap.empty) {
            existingCollections.push(colName);
          }
        } catch {
          // Collection doesn't exist yet
        }
      }

      // Check for admin user
      let hasAdmin = false;
      let hasUsers = false;
      try {
        const usersRef = collection(firestoreClient, 'users');
        const usersSnap = await getDocs(query(usersRef, limit(1)));
        hasUsers = !usersSnap.empty;

        if (hasUsers) {
          const adminSnap = await getDocs(query(usersRef, where('role', 'in', ['admin', 'super_admin']), limit(1)));
          hasAdmin = !adminSnap.empty;
        }
      } catch {
        // Firestore rules might block
      }

      // Check if data has been seeded
      let hasData = false;
      try {
        const dbSeeded = await isDatabaseSeeded();
        hasData = dbSeeded;
      } catch {
        // Can't check — assume not seeded
      }

      setStatus({
        configured,
        connected: true,
        hasUsers,
        hasAdmin,
        hasData,
        collections: existingCollections,
      });

      // Smart routing
      if (hasAdmin && hasData) {
        setStep('done');
      } else if (hasData && !hasAdmin) {
        setStep('admin');
      } else {
        setStep('seed');
      }
    } catch (err) {
      console.error('Status check error:', err);
      setStatus(prev => ({ ...prev, configured: true, connected: false }));
      setStep('seed');
    }
    setChecking(false);
  }

  // ── Seed initial data ──
  async function handleSeedData() {
    setSeeding(true);
    setSeedError('');
    setSeedResults({});

    try {
      const result = await clientSeedInitialData();

      if (result.success) {
        setSeedResults(result.details);
        setStatus(prev => ({ ...prev, hasData: true }));
      } else {
        setSeedError(result.message);
      }
    } catch (err) {
      console.error('Seed error:', err);
      setSeedError(t('setup.seed.error'));
    }
    setSeeding(false);
  }

  // ── Create super admin ──
  async function createSuperAdmin() {
    setAdminError('');
    if (!adminName || !adminEmail || !adminPassword) {
      setAdminError(t('setup.admin.fillAllFields'));
      return;
    }
    if (adminPassword.length < 8) {
      setAdminError(t('setup.admin.passwordMinLength'));
      return;
    }

    setAdminCreating(true);
    try {
      const { createUserWithEmailAndPassword, auth, updateProfile } = await import('@/lib/firebase-client');
      const credential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);

      await updateProfile(credential.user, { displayName: adminName });

      const idToken = await credential.user.getIdToken();

      const { firestoreClient } = await import('@/lib/firebase-client');
      const { doc, setDoc } = await import('firebase/firestore');

      if (firestoreClient) {
        const uid = credential.user.uid;
        await setDoc(doc(firestoreClient, 'users', uid), {
          name: adminName,
          email: adminEmail,
          role: 'super_admin',
          avatar: null,
          phone: null,
          company: null,
          bio: null,
          address: null,
          isActive: true,
          emailVerified: false,
          authProvider: 'email',
          isAnonymous: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Mark setup as complete
      if (firestoreClient) {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(firestoreClient, 'settings', 'app'), {
          setupComplete: true,
          setupDate: new Date(),
          version: '1.0.0',
          appName: 'Carsai Mozambique',
        }, { merge: true });
      }

      // Sign out the admin (they'll log in normally)
      const { signOut } = await import('@/lib/firebase-client');
      await signOut(auth);

      setStep('done');
    } catch (err: any) {
      console.error('Admin creation error:', err);
      let errorMsg = t('setup.admin.error');
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = t('setup.admin.emailInUse');
      } else if (err.code === 'auth/weak-password') {
        errorMsg = t('setup.admin.weakPassword');
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = t('setup.admin.invalidEmail');
      }
      setAdminError(errorMsg);
    }
    setAdminCreating(false);
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  const stepOrder: SetupStep[] = ['check', 'seed', 'admin', 'done'];

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('setup.checking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
            <Settings className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('setup.title')}</h1>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center size-8 rounded-full text-xs font-bold transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' :
                stepOrder.indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {stepOrder.indexOf(step) > i ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 ${
                  stepOrder.indexOf(step) > i ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Firebase Status Check — using plain divs instead of Card to avoid extra spacing */}
        {step === 'check' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                <Database className="size-5" />
                {t('setup.check.title')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('setup.check.description')}
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <StatusItem
                label={t('setup.check.firebaseConfigured')}
                ok={status.configured}
                detail={status.configured ? t('setup.check.credentialsFound') : t('setup.check.addCredentials')}
              />
              <StatusItem
                label={t('setup.check.firestoreConnected')}
                ok={status.connected}
                detail={status.connected ? t('setup.check.connectionEstablished') : t('setup.check.couldNotConnect')}
              />
              <StatusItem
                label={t('setup.check.initialData')}
                ok={status.hasData}
                detail={status.hasData ? t('setup.check.collectionsWithData', { count: status.collections.length }) : t('setup.check.needToPopulate')}
              />
              <StatusItem
                label={t('setup.check.administrator')}
                ok={status.hasAdmin}
                detail={status.hasAdmin ? t('setup.check.adminExists') : t('setup.check.needAdmin')}
              />

              <Separator />

              {status.configured && status.connected ? (
                <Button onClick={() => setStep('seed')} className="w-full" disabled={!status.connected}>
                  {t('common.continue')}
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">{t('setup.check.notConfigured')}</p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        {t('setup.check.checkCredentials')} <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 rounded">src/lib/client-config.ts</code>
                      </p>
                    </div>
                  </div>
                  <Button onClick={checkFirestoreStatus} variant="outline" className="w-full">
                    <RefreshCw className="size-4 mr-2" />
                    {t('common.retry')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Seed Data */}
        {step === 'seed' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                <Database className="size-5" />
                {t('setup.seed.title')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('setup.seed.description')}
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.roles')}</span>
                  <Badge variant="secondary">4</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.permissions')}</span>
                  <Badge variant="secondary">23</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.blogCategories')}</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.forumCategories')}</span>
                  <Badge variant="secondary">4</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.services')}</span>
                  <Badge variant="secondary">6</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.projects')}</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{t('setup.seed.appSettings')}</span>
                  <Badge variant="secondary">17</Badge>
                </div>
              </div>

              {seedError && (
                <p className="text-sm text-destructive">{seedError}</p>
              )}

              {Object.keys(seedResults).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(seedResults).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="size-4" />
                      {key}: {val} {t('setup.seed.created')}
                    </div>
                  ))}
                  <Button onClick={() => setStep('admin')} className="w-full mt-4">
                    {t('setup.seed.continueToAdmin')}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSeedData} className="flex-1" disabled={seeding}>
                    {seeding ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        {t('setup.seed.creating')}
                      </>
                    ) : (
                      <>
                        <Database className="size-4 mr-2" />
                        {t('setup.seed.populate')}
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setStep('admin')} variant="outline">
                    {t('common.skip')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Create Admin */}
        {step === 'admin' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                <Shield className="size-5" />
                {t('setup.admin.title')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('setup.admin.description')}
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">{t('setup.admin.fullName')}</Label>
                <Input
                  id="admin-name"
                  type="text"
                  placeholder={t('setup.admin.namePlaceholder')}
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">{t('setup.admin.emailLabel')}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder={t('setup.admin.emailPlaceholder')}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">{t('setup.admin.passwordLabel')}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={t('setup.admin.passwordPlaceholder')}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              {adminError && (
                <p className="text-sm text-destructive">{adminError}</p>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <Lock className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">{t('setup.admin.secureAccount')}</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    {t('setup.admin.secureAccountDesc')}
                  </p>
                </div>
              </div>

              <Button onClick={createSuperAdmin} className="w-full" disabled={adminCreating}>
                {adminCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('setup.admin.creating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    {t('setup.admin.createButton')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                <CheckCircle2 className="size-5 text-green-500" />
                {t('setup.done.title')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('setup.done.description')}
              </p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  {t('setup.done.firebaseConfigured')}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  {Object.keys(seedResults).length > 0 || status.hasData
                    ? t('setup.done.dataPopulated')
                    : t('setup.done.dbReady')}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  {t('setup.done.adminCreated')}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  {t('setup.done.installerLocked')}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <Shield className="size-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200">{t('setup.done.nextStep')}</p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    {t('setup.done.nextStepDesc')}
                  </p>
                </div>
              </div>

              <Button onClick={() => router.push('/auth')} className="w-full" size="lg">
                {t('setup.done.goToLogin')}
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Status Item Component
// ──────────────────────────────────────────────

function StatusItem({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="size-5 text-green-500" />
        ) : (
          <XCircle className="size-5 text-red-500" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}
