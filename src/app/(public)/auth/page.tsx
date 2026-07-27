'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Phone,
  Mail,
  ArrowLeft,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';

// ──────────────────────────────────────────────
// Auth Page Component
// ──────────────────────────────────────────────

type LoginMode = 'email' | 'phone';

export default function AuthPage() {
  const { t } = useLanguage();
  const { login, register, isAuthenticated, user, hasHydrated, lastLoginError, lastRegisterError } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('email');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // ── Redirect if already logged in (after hydration) ──
  useEffect(() => {
    if (!hasHydrated) return; // Wait for Zustand persist to hydrate
    if (isAuthenticated && user) {
      const role = user.role;
      if (role === 'super_admin' || role === 'admin') {
        router.replace('/admin');
      } else if (role === 'partner') {
        router.replace('/partner');
      } else {
        router.replace('/user');
      }
    }
  }, [isAuthenticated, user, router, hasHydrated]);

  // ── Show loading spinner while hydration hasn't completed ──
  if (!hasHydrated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Show redirect message while navigating ──
  if (isAuthenticated && user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">{t('auth.redirecting') || 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  const handleLogin = async () => {
    setLoginError('');
    if (!loginIdentifier) {
      setLoginError(loginMode === 'email' ? t('auth.emailRequired') : t('auth.phoneRequired') || 'Phone number is required');
      return;
    }
    if (!loginPassword) {
      setLoginError(t('auth.passwordRequired'));
      return;
    }
    setLoginLoading(true);
    try {
      const result = await login(loginIdentifier, loginPassword);
      if (result.success) {
        const role = useAuthStore.getState().user?.role;
        toast.success(t('auth.loginSuccess'));
        if (role === 'super_admin' || role === 'admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
      } else {
        setLoginError(result.error || t('auth.invalidCredentials') || 'Credenciais inválidas');
        toast.error(result.error || t('auth.invalidCredentials'));
      }
    } catch {
      setLoginError(t('auth.invalidCredentials') || 'Credenciais inválidas');
      toast.error(t('auth.invalidCredentials'));
    }
    setLoginLoading(false);
  };

  const handleRegister = async () => {
    setRegisterError('');
    if (!registerName) {
      setRegisterError(t('auth.fullNameRequired') || 'Full name is required');
      return;
    }
    if (!registerEmail) {
      setRegisterError(t('auth.emailRequired'));
      return;
    }
    if (!registerPassword || registerPassword.length < 8) {
      setRegisterError(t('auth.passwordMinLength'));
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError(t('auth.passwordsDoNotMatch'));
      return;
    }
    setRegisterLoading(true);
    try {
      const result = await register(registerName, registerEmail, registerPassword, registerPhone || undefined);
      if (result.success) {
        toast.success(t('auth.registerSuccess'));
        router.push('/user');
      } else {
        setRegisterError(result.error || t('common.error') || 'Falha ao criar conta. Por favor, tente novamente.');
        toast.error(result.error || t('common.error'));
      }
    } catch {
      setRegisterError('Erro de ligação. Verifique a sua rede e tente novamente.');
      toast.error('Erro de ligação');
    }
    setRegisterLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Carsai Mozambique"
              width={48}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <p className="text-muted-foreground text-sm text-center">
            {activeTab === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1 gap-1">
                  <LogIn className="size-4" />
                  {t('auth.login')}
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 gap-1">
                  <UserPlus className="size-4" />
                  {t('auth.register')}
                </TabsTrigger>
              </TabsList>

              {/* ── Login Tab ── */}
              <TabsContent value="login" className="space-y-4">
                {/* Login Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={loginMode === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMode('email')}
                    className="flex-1 gap-1"
                  >
                    <Mail className="size-4" />
                    {t('auth.email')}
                  </Button>
                  <Button
                    variant={loginMode === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMode('phone')}
                    className="flex-1 gap-1"
                  >
                    <Phone className="size-4" />
                    {t('auth.phone')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {loginMode === 'email' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.mz"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="login-phone">{t('auth.phone')}</Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="+258 84 123 4567"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder={t('auth.password')}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-sm text-destructive">{loginError}</p>
                  )}

                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <span className="animate-pulse">{t('auth.login')}...</span>
                    ) : (
                      t('auth.login')
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('auth.noAccount')}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => setActiveTab('register')}
                    >
                      {t('auth.register')}
                    </button>
                  </p>
                </div>
              </TabsContent>

              {/* ── Register Tab ── */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-name">{t('auth.fullName')}</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={t('auth.fullName')}
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-email">{t('auth.email')}</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.mz"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        placeholder={t('auth.passwordMinLength')}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-confirm-password">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showRegisterConfirmPassword ? 'text' : 'password'}
                        placeholder={t('auth.confirmPassword')}
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                        aria-label={showRegisterConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterConfirmPassword ? (
                          <EyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-phone">
                      <span>{t('auth.phone')}</span>
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({t('auth.optional') || 'optional'})
                      </span>
                    </Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+258 84 123 4567"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>

                  {registerError && (
                    <p className="text-sm text-destructive">{registerError}</p>
                  )}

                  <Button
                    onClick={handleRegister}
                    className="w-full"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <span className="animate-pulse">{t('auth.createAccount')}...</span>
                    ) : (
                      t('auth.createAccount')
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => setActiveTab('login')}
                    >
                      {t('auth.login')}
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/home"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('auth.backToHome') || 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
