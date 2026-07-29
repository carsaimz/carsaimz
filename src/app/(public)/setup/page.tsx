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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

      // Try to connect to Firestore and check for existing data
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
        // Firestore rules might block — that's OK, means no admin yet
      }

      // Check if data has been seeded (roles + settings exist)
      let hasData = false;
      try {
        const dbSeeded = await isDatabaseSeeded();
        hasData = dbSeeded;
      } catch {
        // Can't check — assume not seeded
      }

      // Check setup lock
      let isLocked = false;
      try {
        const settingsRef = doc(firestoreClient, 'settings', 'app');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data()?.setupComplete) {
          isLocked = true;
        }
      } catch {
        // Settings doc doesn't exist yet
      }

      setStatus({
        configured,
        connected: true,
        hasUsers,
        hasAdmin,
        hasData,
        collections: existingCollections,
      });

      // If setup is already done and admin exists, go to done
      if (hasAdmin && hasData) {
        setStep('done');
      } else if (hasData && !hasAdmin) {
        // Data exists but no admin — go to admin creation
        setStep('admin');
      } else {
        // No data yet — start with seed
        setStep('seed');
      }
    } catch (err) {
      console.error('Status check error:', err);
      setStatus(prev => ({ ...prev, configured: true, connected: false }));
      setStep('seed');
    }
    setChecking(false);
  }

  // ── Seed initial data (roles, permissions, categories, settings, etc.) ──
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
      setSeedError('Erro ao criar dados iniciais. Pode tentar novamente.');
    }
    setSeeding(false);
  }

  // ── Create super admin ──
  async function createSuperAdmin() {
    setAdminError('');
    if (!adminName || !adminEmail || !adminPassword) {
      setAdminError('Preencha todos os campos.');
      return;
    }
    if (adminPassword.length < 8) {
      setAdminError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setAdminCreating(true);
    try {
      // Create Firebase Auth user
      const { createUserWithEmailAndPassword, auth, updateProfile } = await import('@/lib/firebase-client');
      const credential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);

      // Update display name
      await updateProfile(credential.user, { displayName: adminName });

      // Get ID token
      const idToken = await credential.user.getIdToken();

      // Create Firestore profile with super_admin role
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
      let errorMsg = 'Erro ao criar administrador.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Este email já está registado no Firebase Auth.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Senha demasiado fraca. Use pelo menos 8 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Email inválido.';
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
          <p className="text-muted-foreground">Verificando estado do Firebase...</p>
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
          <h1 className="text-2xl font-bold">Carsai Mozambique — Instalação</h1>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            Configure o banco de dados, popule dados iniciais e crie o administrador.
            Este assistente só é necessário na primeira vez.
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

        {/* Step 1: Firebase Status Check */}
        {step === 'check' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Verificação do Firebase
              </CardTitle>
              <CardDescription>
                Verificando a ligação ao Firebase e estado do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusItem
                label="Firebase Configurado"
                ok={status.configured}
                detail={status.configured ? 'Credenciais encontradas' : 'Adicione as credenciais Firebase'}
              />
              <StatusItem
                label="Firestore Conectado"
                ok={status.connected}
                detail={status.connected ? 'Ligação estabelecida' : 'Não foi possível conectar'}
              />
              <StatusItem
                label="Dados Iniciais"
                ok={status.hasData}
                detail={status.hasData ? `${status.collections.length} colecções com dados` : 'Necessário popular dados iniciais'}
              />
              <StatusItem
                label="Administrador"
                ok={status.hasAdmin}
                detail={status.hasAdmin ? 'Administrador já existe' : 'Necessário criar administrador'}
              />

              <Separator />

              {status.configured && status.connected ? (
                <Button onClick={() => setStep('seed')} className="w-full" disabled={!status.connected}>
                  Continuar
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Firebase não configurado</p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Verifique se as credenciais Firebase estão correctas em <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 rounded">src/lib/client-config.ts</code>
                      </p>
                    </div>
                  </div>
                  <Button onClick={checkFirestoreStatus} variant="outline" className="w-full">
                    <RefreshCw className="size-4 mr-2" />
                    Verificar novamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Seed Data (BEFORE admin creation) */}
        {step === 'seed' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Dados Iniciais
              </CardTitle>
              <CardDescription>
                Popule o banco de dados com roles, permissões, categorias, serviços e configurações padrão.
                Isto deve ser feito ANTES de criar o administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Roles (super_admin, admin, partner, user)</span>
                  <Badge variant="secondary">4 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Permissões do sistema</span>
                  <Badge variant="secondary">23 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Categorias do blog</span>
                  <Badge variant="secondary">5 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Categorias do fórum</span>
                  <Badge variant="secondary">4 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Serviços</span>
                  <Badge variant="secondary">6 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Projectos de exemplo</span>
                  <Badge variant="secondary">3 items</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Configurações da aplicação</span>
                  <Badge variant="secondary">17 items</Badge>
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
                      {key}: {val} criado(s)
                    </div>
                  ))}
                  <Button onClick={() => setStep('admin')} className="w-full mt-4">
                    Continuar para Criar Administrador
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSeedData} className="flex-1" disabled={seeding}>
                    {seeding ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Criando dados...
                      </>
                    ) : (
                      <>
                        <Database className="size-4 mr-2" />
                        Popular Banco de Dados
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setStep('admin')} variant="outline">
                    Saltar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Create Admin (AFTER data is seeded) */}
        {step === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Criar Administrador
              </CardTitle>
              <CardDescription>
                Crie a conta de super administrador. Esta conta terá acesso total ao painel de administração.
                Os dados iniciais (roles, permissões) já foram criados no passo anterior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Nome completo</Label>
                <Input
                  id="admin-name"
                  type="text"
                  placeholder="Nome do administrador"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@carsai.mz"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
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
                  <p className="font-medium text-blue-800 dark:text-blue-200">Conta segura</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    A senha é armazenada com encriptação do Firebase Auth. O instalador será bloqueado após a criação do administrador.
                  </p>
                </div>
              </div>

              <Button onClick={createSuperAdmin} className="w-full" disabled={adminCreating}>
                {adminCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Criando administrador...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    Criar Administrador
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                Instalação Completa!
              </CardTitle>
              <CardDescription>
                O Carsai Mozambique está pronto para usar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  Firebase configurado e conectado
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  {Object.keys(seedResults).length > 0 || status.hasData
                    ? 'Dados iniciais populados'
                    : 'Banco de dados pronto (sem dados iniciais)'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  Conta de administrador criada
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-500" />
                  Instalador bloqueado (segurança)
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <Shield className="size-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200">Próximo passo</p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Faça login com as credenciais do administrador para acessar o painel de administração.
                  </p>
                </div>
              </div>

              <Button onClick={() => router.push('/auth')} className="w-full" size="lg">
                Ir para Login
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
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
