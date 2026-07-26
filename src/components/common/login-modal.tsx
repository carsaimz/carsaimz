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
  Shield,
  Briefcase,
  User,
  LogIn,
  Car,
} from 'lucide-react';

import { useAuthStore, useAppStore, type UserRole } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';

// ──────────────────────────────────────────────
// Login Modal Component
// ──────────────────────────────────────────────

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { t } = useLanguage();
  const { login, loginAsDemo, register } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const [loginLoading, setLoginLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

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
      const success = await login(loginEmail, loginPassword);
      if (success) {
        // Navigate based on role
        const role = useAuthStore.getState().user?.role;
        if (role === 'admin') router.push('/admin');
        else if (role === 'partner') router.push('/partner');
        else router.push('/user');
        onOpenChange(false);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(t('auth.invalidCredentials'));
      }
    } catch {
      setLoginError(t('auth.invalidCredentials'));
    }
    setLoginLoading(false);
  };

  const handleRegister = () => {
    setRegisterError('');
    if (!registerName) {
      setRegisterError(t('auth.emailRequired')); // generic "required" fallback
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
    const success = register(registerName, registerEmail, registerPassword);
    if (success) {
      router.push('/user');
      onOpenChange(false);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
    } else {
      setRegisterError(t('common.error'));
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setDemoLoading(role);
    await loginAsDemo(role);
    // Navigate to appropriate path based on role
    if (role === 'admin') router.push('/admin');
    else if (role === 'partner') router.push('/partner');
    else router.push('/user');
    onOpenChange(false);
    setDemoLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="size-5 text-primary" />
            Carsai Moçambique
          </DialogTitle>
          <DialogDescription>
            {t('auth.welcomeBack')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              <LogIn className="size-4 mr-1" />
              {t('auth.login')}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              {t('auth.register')}
            </TabsTrigger>
          </TabsList>

          {/* ── Login Tab ── */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t('auth.email')}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@carsai.mz"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t('auth.password')}</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="demo123"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}

              <Button onClick={handleLogin} className="w-full">
                {t('auth.login')}
              </Button>
            </div>

            <Separator />

            {/* Demo Login Buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Demo accounts for testing:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Shield className="size-4" />
                  <span className="text-xs">Admin</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('partner')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Briefcase className="size-4" />
                  <span className="text-xs">Partner</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('user')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <User className="size-4" />
                  <span className="text-xs">User</span>
                </Button>
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password">{t('auth.password')}</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder={t('auth.passwordMinLength')}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </div>

              {registerError && (
                <p className="text-sm text-destructive">{registerError}</p>
              )}

              <Button onClick={handleRegister} className="w-full">
                {t('auth.createAccount')}
              </Button>
            </div>

            <Separator />

            {/* Demo Login Buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Or try a demo account:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Shield className="size-4" />
                  <span className="text-xs">Admin</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('partner')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Briefcase className="size-4" />
                  <span className="text-xs">Partner</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('user')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <User className="size-4" />
                  <span className="text-xs">User</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
