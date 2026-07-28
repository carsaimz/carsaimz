'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  LogIn,
  Car,
  Eye,
  EyeOff,
  Phone,
  Mail,
  UserPlus,
  User,
} from 'lucide-react';

import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FEATURES } from '@/lib/client-config';

// ──────────────────────────────────────────────
// Login Modal Component
// ──────────────────────────────────────────────

type LoginMode = 'email' | 'phone';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { t } = useLanguage();
  const store = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('email');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Phone auth state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

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

  // Social login loading
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail) {
      setLoginError(t('auth.emailRequired'));
      return;
    }
    if (!loginPassword) {
      setLoginError(t('auth.passwordRequired'));
      return;
    }
    setLoginLoading(true);
    try {
      const result = await store.loginWithEmailPassword(loginEmail, loginPassword);
      if (result.success) {
        const role = useAuthStore.getState().user?.role;
        toast.success(t('auth.loginSuccess'));
        if (role === 'admin' || role === 'super_admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
        onOpenChange(false);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(result.error || t('auth.invalidCredentials'));
        toast.error(result.error || t('auth.invalidCredentials'));
      }
    } catch {
      setLoginError(t('auth.invalidCredentials'));
      toast.error(t('auth.invalidCredentials'));
    }
    setLoginLoading(false);
  };

  const handlePhoneSendCode = async () => {
    setPhoneError('');
    if (!phoneNumber) {
      setPhoneError(t('auth.phoneRequired'));
      return;
    }
    setPhoneLoading(true);
    try {
      const result = await store.loginWithPhone(phoneNumber, 'phone-recaptcha-container');
      if (result) {
        setVerificationId(result.verificationId);
        toast.success(t('auth.sendSmsCode'));
      } else {
        setPhoneError(t('auth.loginFailed'));
      }
    } catch {
      setPhoneError(t('auth.loginFailed'));
    }
    setPhoneLoading(false);
  };

  const handlePhoneVerify = async () => {
    setPhoneError('');
    if (!otpCode) {
      setPhoneError(t('auth.phoneRequired'));
      return;
    }
    if (!verificationId) {
      setPhoneError(t('auth.loginFailed'));
      return;
    }
    setPhoneLoading(true);
    try {
      const result = await store.verifyPhoneCode(verificationId, otpCode);
      if (result.success) {
        const role = useAuthStore.getState().user?.role;
        toast.success(t('auth.loginSuccess'));
        if (role === 'admin' || role === 'super_admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
        onOpenChange(false);
        setPhoneNumber('');
        setOtpCode('');
        setVerificationId(null);
      } else {
        setPhoneError(result.error || t('auth.loginFailed'));
      }
    } catch {
      setPhoneError(t('auth.loginFailed'));
    }
    setPhoneLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await store.loginWithGoogle();
      if (result.success) {
        const role = useAuthStore.getState().user?.role;
        toast.success(t('auth.loginSuccess'));
        if (role === 'admin' || role === 'super_admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
        onOpenChange(false);
      } else {
        toast.error(result.error || t('auth.loginFailed'));
      }
    } catch {
      toast.error(t('auth.loginFailed'));
    }
    setGoogleLoading(false);
  };

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    try {
      const result = await store.loginWithGithub();
      if (result.success) {
        const role = useAuthStore.getState().user?.role;
        toast.success(t('auth.loginSuccess'));
        if (role === 'admin' || role === 'super_admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
        onOpenChange(false);
      } else {
        toast.error(result.error || t('auth.loginFailed'));
      }
    } catch {
      toast.error(t('auth.loginFailed'));
    }
    setGithubLoading(false);
  };

  const handleAnonymousLogin = async () => {
    setAnonymousLoading(true);
    try {
      const result = await store.loginAnonymously();
      if (result.success) {
        toast.success(t('auth.loginSuccess'));
        router.push('/user');
        onOpenChange(false);
      } else {
        toast.error(result.error || t('auth.loginFailed'));
      }
    } catch {
      toast.error(t('auth.loginFailed'));
    }
    setAnonymousLoading(false);
  };

  const handleRegister = async () => {
    setRegisterError('');
    if (!registerName) {
      setRegisterError(t('auth.fullNameRequired'));
      return;
    }
    if (!registerEmail) {
      setRegisterError(t('auth.emailRequired'));
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError(t('auth.passwordMinLength'));
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError(t('auth.passwordsDoNotMatch'));
      return;
    }
    setRegisterLoading(true);
    try {
      const result = await store.register(registerName, registerEmail, registerPassword, registerPhone || undefined);
      if (result.success) {
        toast.success(t('auth.registerSuccess'));
        router.push('/user');
        onOpenChange(false);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        setRegisterPhone('');
      } else {
        setRegisterError(result.error || t('common.error'));
        toast.error(result.error || t('common.error'));
      }
    } catch {
      setRegisterError(t('common.error'));
      toast.error(t('common.error'));
    }
    setRegisterLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="size-5 text-primary" />
            Carsai Mozambique
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
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
          <TabsContent value="login" className="space-y-4 mt-4">
            {/* Social Login Buttons */}
            <div className="space-y-2">
              {FEATURES.googleSignIn && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? t('auth.signingIn') : t('auth.signInWithGoogle')}
                </Button>
              )}
              {FEATURES.githubSignIn && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGithubLogin}
                  disabled={githubLoading}
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {githubLoading ? t('auth.signingIn') : t('auth.signInWithGithub')}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleAnonymousLogin}
                disabled={anonymousLoading}
              >
                <User className="size-4" />
                {anonymousLoading ? t('auth.signingIn') : t('auth.signInAsGuest')}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.or')}
                </span>
              </div>
            </div>

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
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.mz"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
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
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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
                  <Button onClick={handleLogin} className="w-full" disabled={loginLoading}>
                    {loginLoading ? (
                      <span className="animate-pulse">{t('auth.login')}...</span>
                    ) : (
                      t('auth.login')
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Phone Auth — reCAPTCHA container */}
                  <div id="phone-recaptcha-container" />
                  {!verificationId ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-phone">{t('auth.phone')}</Label>
                        <Input
                          id="login-phone"
                          type="tel"
                          placeholder="+258 847545020"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          autoComplete="tel"
                        />
                      </div>
                      {phoneError && (
                        <p className="text-sm text-destructive">{phoneError}</p>
                      )}
                      <Button onClick={handlePhoneSendCode} className="w-full" disabled={phoneLoading}>
                        {phoneLoading ? (
                          <span className="animate-pulse">{t('auth.sendingCode')}</span>
                        ) : (
                          t('auth.sendSmsCode')
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="otp-code">{t('auth.smsCode')}</Label>
                        <Input
                          id="otp-code"
                          type="text"
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          maxLength={6}
                          autoComplete="one-time-code"
                          onKeyDown={(e) => e.key === 'Enter' && handlePhoneVerify()}
                        />
                      </div>
                      {phoneError && (
                        <p className="text-sm text-destructive">{phoneError}</p>
                      )}
                      <Button onClick={handlePhoneVerify} className="w-full" disabled={phoneLoading}>
                        {phoneLoading ? (
                          <span className="animate-pulse">{t('auth.verifying')}</span>
                        ) : (
                          t('auth.verifyCode')
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => { setVerificationId(null); setOtpCode(''); }}
                      >
                        {t('auth.resendCode')}
                      </Button>
                    </>
                  )}
                </>
              )}

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
            </div>
          </TabsContent>

          {/* ── Register Tab ── */}
          <TabsContent value="register" className="space-y-4 mt-4">
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
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
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
                    ({t('auth.optional') || 'opcional'})
                  </span>
                </Label>
                <Input
                  id="register-phone"
                  type="tel"
                  placeholder="+258 847545020"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              {registerError && (
                <p className="text-sm text-destructive">{registerError}</p>
              )}

              <Button onClick={handleRegister} className="w-full" disabled={registerLoading}>
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
      </DialogContent>
    </Dialog>
  );
}
