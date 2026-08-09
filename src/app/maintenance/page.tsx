'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { LanguageCode } from '@/lib/i18n';
import { Logo } from '@/components/common/logo';

export default function MaintenancePage() {
  const { t, language, setLanguage, languages } = useLanguage();
  useDocumentTitle('maintenance.title', 'Em Manutenção');
  const router = useRouter();
  const store = useAuthStore();

  const [showLogin, setShowLogin] = useState(false);
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('maintenance.emailRequired') || t('auth.emailRequired') || 'Email é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const result = await store.loginWithEmailPassword(email, password);
      if (result.success) {
        const role = result.user?.role || useAuthStore.getState().user?.role;
        if (role === 'admin' || role === 'super_admin') {
          // Set the role cookie so middleware/proxy allows access
          document.cookie = `carsai-role=${role};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;

          // Also set the ID token cookie for proxy verification
          const idToken = useAuthStore.getState().idToken;
          if (idToken) {
            document.cookie = `carsai-id-token=${idToken};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;
          }

          toast.success(t('maintenance.loginSuccess') || 'Sessão iniciada com sucesso');
          router.push('/admin');
        } else {
          setError(t('maintenance.adminOnly') || 'Apenas administradores podem aceder durante a manutenção');
          await store.logout();
        }
      } else {
        setError(result.error || t('maintenance.loginFailed') || t('auth.invalidCredentials') || 'Credenciais inválidas');
      }
    } catch (err) {
      setError(t('maintenance.loginFailed') || t('auth.invalidCredentials') || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-red-100/50 dark:bg-red-900/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-red-100/30 dark:bg-red-900/5 blur-3xl" />
      </div>

      {/* Language Switcher — top right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setShowLangSwitcher(!showLangSwitcher)}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs">{languages.find(l => l.code === language)?.flag || '🌐'}</span>
          </Button>

          <AnimatePresence>
            {showLangSwitcher && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as LanguageCode);
                      setShowLangSwitcher(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                      language === lang.code ? 'bg-accent/50 font-medium' : ''
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <Logo size="2xl" className="mx-auto mb-4 rounded-xl shadow-lg" />
          <h1 className="text-2xl font-bold text-foreground">CarsaiMz</h1>
        </motion.div>

        {/* Maintenance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-red-200/50 dark:border-red-900/30 shadow-xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 5 }}
                className="mx-auto mb-4"
              >
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 inline-flex">
                  <Wrench className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
              </motion.div>
              <CardTitle className="text-xl text-foreground">
                {t('maintenance.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-2">
                {t('maintenance.message')}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-6">
                {t('maintenance.backSoon')}
              </p>

              {/* Animated dots */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Admin login section */}
              <AnimatePresence mode="wait">
                {!showLogin ? (
                  <motion.div
                    key="admin-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground border-muted-foreground/20 hover:border-muted-foreground/40"
                      onClick={() => setShowLogin(true)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {t('maintenance.adminLogin') || 'Acesso Administrativo'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 border-t pt-4"
                  >
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
                        {t('maintenance.adminLogin') || 'Acesso Administrativo'}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {t('maintenance.adminOnly') || 'Apenas administradores podem aceder durante a manutenção'}
                      </p>
                      <form onSubmit={handleLogin} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-email" className="text-xs">
                            {t('maintenance.email') || t('auth.email') || 'E-mail'}
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="admin-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="admin@carsai.mz"
                              className="pl-9 h-9 text-sm focus-visible:ring-red-500"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-password" className="text-xs">
                            {t('maintenance.password') || t('auth.password') || 'Palavra-passe'}
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="admin-password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="pl-9 pr-9 h-9 text-sm focus-visible:ring-red-500"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            {t('maintenance.login') || t('auth.login') || 'Entrar'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-muted-foreground"
                            onClick={() => {
                              setShowLogin(false);
                              setError('');
                            }}
                          >
                            {t('common.cancel') || 'Cancelar'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground/50 mt-6"
        >
          © {new Date().getFullYear()} Carsai Mozambique
        </motion.p>
      </motion.div>
    </div>
  );
}
