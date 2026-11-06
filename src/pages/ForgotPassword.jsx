import PaperPlaneLoader from '@/components/PaperPlaneLoader';
import { t } from '@/lib/i18n';
import { api } from '@/api/apiClient';
import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.resetPasswordRequest({ email });
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title={t("Recupere seu acesso.")}
      subtitle={t("Enviaremos um link para você escolher uma nova senha.")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />{t("Voltar para entrar")} </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center"> {t("Se este e-mail tiver uma conta, você receberá um link para criar uma nova senha.")} </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("E-mail da sua conta")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t("voce@exemplo.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <PaperPlaneLoader className="w-4 h-4 mr-2 " /> {t("Enviando…")} </>
            ) : (
              t("Enviar link de recuperação")
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
