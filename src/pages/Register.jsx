import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { t } from '@/lib/i18n';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Lock } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('As senhas precisam ser iguais.'));
      return;
    }
    setLoading(true);
    try {
      const result = await api.auth.register({ email, password });
      if (result?.access_token) api.auth.setToken(result.access_token);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || t('Não foi possível criar a conta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('Sua próxima viagem começa aqui.')}
      subtitle={t('Crie sua conta e traga o grupo.')}
      footer={
        <>
          {t('Já tem uma conta?')}{' '}
          <Link
            to={'/login' + (safeReturnTo() !== '/' ? '?returnTo=' + encodeURIComponent(safeReturnTo()) : '')}
            className="text-primary font-medium hover:underline"
          >
            {t('Entrar')}
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('E-mail')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder={t('voce@exemplo.com')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('Senha')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('Confirme a senha')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <PaperPlaneLoader className="w-4 h-4 mr-2" /> {t('Criando conta…')}
            </>
          ) : (
            t('Criar conta')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
