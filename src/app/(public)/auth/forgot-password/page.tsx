'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { apiFetch, safeJson } from '@/lib/api-fetch';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  useDocumentTitle('auth.forgotPassword', 'Recuperar Senha');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await safeJson(res);
      if (data?.success) {
        setSent(true);
        toast({ title: t('auth.resetEmailSent') || 'E-mail de recuperação enviado' });
      } else {
        toast({
          title: t('auth.resetEmailFailed') || 'Falha ao enviar e-mail',
          description: data?.error || '',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <Mail className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>{t('auth.forgotPassword') || 'Recuperar Senha'}</CardTitle>
            <CardDescription>
              {t('auth.forgotPasswordDesc') || 'Insira o seu e-mail para receber um link de recuperação'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {t('auth.resetEmailSentDesc') || 'Se existir uma conta com este e-mail, receberá um link para redefinir a sua senha.'}
                </p>
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('auth.backToLogin') || 'Voltar ao Login'}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email') || 'E-mail'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {t('auth.sendResetLink') || 'Enviar Link de Recuperação'}
                </Button>
                <Link href="/auth" className="block text-center">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('auth.backToLogin') || 'Voltar ao Login'}
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
