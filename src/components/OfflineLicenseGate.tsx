/**
 * OfflineLicenseGate
 *
 * Renderizado APENAS no build offline antes do <App />.
 * - Mostra spinner enquanto consulta /api/license
 * - Bloqueia acesso se licença inválida/expirada com tela elegante
 * - Quando válida, renderiza children (a aplicação completa)
 *
 * Tela de bloqueio NÃO ensina como editar o arquivo (a licença agora é
 * criptografada). Em vez disso, exibe CTA grande para WhatsApp do
 * proprietário (+55 11 96351-2105) e um QR code para o cliente abrir
 * a conversa direto pelo celular.
 */
import React from 'react';
import { useOfflineLicense } from '@/contexts/OfflineLicenseContext';
import { ShieldAlert, Loader2, HardDrive, MessageCircle, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';

const SUPPORT_PHONE = '5511963512105'; // +55 (11) 96351-2105 no formato internacional sem '+'
const SUPPORT_PHONE_DISPLAY = '+55 (11) 96351-2105';

function buildWhatsAppUrl(clientName?: string | null, expiredAt?: string | null) {
  const lines = [
    'Olá! Preciso renovar minha licença do XLata PDV Offline.',
    clientName ? `Cliente: ${clientName}` : null,
    expiredAt ? `Licença expirou em: ${expiredAt}` : null,
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${SUPPORT_PHONE}?text=${text}`;
}

export const OfflineLicenseGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { license, loading } = useOfflineLicense();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm">Carregando XLata PDV Offline...</p>
        </div>
      </div>
    );
  }

  if (!license || !license.valid) {
    const expiredAt = license?.expires_at
      ? new Date(license.expires_at).toLocaleDateString('pt-BR')
      : null;
    const whatsAppUrl = buildWhatsAppUrl(license?.client_name, expiredAt);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
        <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            {expiredAt ? 'Licença expirada' : 'Licença inválida'}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-2">
            {expiredAt
              ? `Sua licença expirou em ${expiredAt} e o acesso foi bloqueado.`
              : 'Não foi possível validar sua licença local.'}
          </p>
          {license?.client_name && (
            <p className="text-xs text-muted-foreground text-center mb-6">
              Cliente: <strong>{license.client_name}</strong>
            </p>
          )}

          <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-center mb-1">
              Solicite uma nova licença agora
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-5">
              Entre em contato com o proprietário pelo WhatsApp e receba seu novo
              arquivo <code>license.xlata</code> em minutos.
            </p>

            <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-center">
              <div className="space-y-3 order-2 sm:order-1">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-base"
                >
                  <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Falar no WhatsApp
                  </a>
                </Button>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">ou ligue / mande mensagem para</p>
                  <p className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-500">
                    {SUPPORT_PHONE_DISPLAY}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 order-1 sm:order-2">
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <QRCodeSVG
                    value={whatsAppUrl}
                    size={160}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Smartphone className="w-3 h-3" />
                  Aponte a câmera
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
            <p>
              Após receber o novo arquivo, substitua <code>license.xlata</code> na
              pasta <code>xlata-pdv-offline/</code> e reinicie o servidor.
            </p>
            <p className="text-[11px]">
              ⚠️ Não tente editar a licença manualmente — o arquivo é criptografado
              e assinado, qualquer alteração invalida o acesso.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
            <HardDrive className="w-3 h-3" />
            XLata PDV Offline
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
