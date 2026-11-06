import { t } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass, ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  return <main className="flex min-h-screen items-center justify-center p-6"><div className="empty-state max-w-md w-full"><Compass className="h-12 w-12 text-primary mb-4" /><p className="eyebrow">{t("Fora do roteiro / 404")}</p><h1 className="mt-3 text-2xl font-bold">{t("Esse destino não existe.")}</h1><p className="mt-3 mb-6 text-sm text-muted-foreground">{t("O endereço pode ter mudado. Vamos voltar para o começo?")}</p><Button asChild><Link to="/"><ArrowLeft /> {t("Voltar ao início")}</Link></Button></div></main>;
}
