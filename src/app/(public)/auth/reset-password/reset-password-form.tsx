'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/use-document-title';
import Link from 'next/link';

export function ResetPasswordForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  useDocumentTitle('auth.resetPassword', 'Redefinir Senha');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const oobCode = searchParams.get('oobCode');

  // Verify the oobCode on mount
  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      return;
    }
    // Use Firebase client SDK to verify the code
    import('firebase/auth').then(({ getAuth, verifyPasswordResetCode }) => {
      const auth = getAuth();
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setVerifiedEmail(email);
          setVerifying(false);
        })
        .catch((err) => {
          console.error('oobCode verification failed:', err);
          if (err.code === 'auth/expired-action-code') {
            setError(t('auth.invalidResetLink') || 'Link expired');
          } else {
            setError(t('auth.invalidResetLink') || 'Invalid reset link');
          }
          setVerifying(false);
        });
    }).catch(() => {
      setError('Firebase not available');
      setVerifying(false);
    });
  }, [oobCode, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDontMatch') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort') || 'Password too short');
      return;
    }

    setLoading(true);
    try {
      // Use Firebase client SDK to confirm the reset directly
      const { getAuth, confirmPasswordReset } = await import('firebase/auth');
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setSuccess(true);
      toast({ title: t('auth.passwordResetSuccess') || 'Password reset successfully' });
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/weak-password') {
        setError(t('auth.passwordTooShort') || 'Password too weak');
      } else if (err.code === 'auth/expired-action-code') {
        setError(t('auth.invalidResetLink') || 'Link expired');
      } else {
        setError(err.message || t('auth.passwordResetFailed') || 'Failed to reset password');
      }
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
              <KeyRound className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>{t('auth.resetPassword') || 'Redefinir Senha'}</CardTitle>
            <CardDescription>
              {t('auth.resetPasswordDesc') || 'Insira a sua nova senha'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifying ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              </div>
            ) : !oobCode || error ? (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {error || t('auth.invalidResetLink') || 'Invalid or expired recovery link'}
                </p>
                <Link href="/auth/forgot-password">
                  <Button variant="outline" className="w-full">
                    {t('auth.requestNewLink') || 'Request new link'}
                  </Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {t('auth.passwordResetSuccessDesc') || 'Password reset successfully. You can now log in.'}
                </p>
                <Link href="/auth">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {t('auth.goToLogin') || 'Go to Login'}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {verifiedEmail && (
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {t('auth.email') || 'E-mail'}: <strong>{verifiedEmail}</strong>
                  </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('auth.newPassword') || 'New Password'}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword') || 'Confirm Password'}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4 mr-2" />
                    )}
                    {t('auth.resetPassword') || 'Reset Password'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
