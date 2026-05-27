/**
 * LicenseGenerator
 *
 * Página standalone para REGERAR apenas o arquivo `license.xlata` de um
 * cliente PDV Offline existente. Não inclui o template completo (~6 MB),
 * apenas o arquivo de licença encriptado (~1 KB) — perfeito para enviar
 * por WhatsApp / e-mail quando o cliente solicita renovação.
 *
 * O cliente deve substituir o `license.xlata` na raiz da pasta
 * `xlata-pdv-offline/` e reiniciar o servidor.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { encryptLicense, decryptLicense } from '@/lib/offlineLicenseCrypto';
import type { OfflinePlan, OfflineLicensePayload } from '@/lib/offlineLicenseSecret';
import {
  Download,
  KeyRound,
  Calendar as CalendarIcon,
  Lock,
  Crown,
  Sparkles,
  RefreshCw,
  FileCheck2,
  Upload,
  ShieldCheck,
} from 'lucide-react';

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cliente';

const randomLicense = () => {
  const block = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `XLATA-${block()}-${block()}-${block()}`;
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toLocalInput(d);
}

const QUICK_DURATIONS: { label: string; ms: number }[] = [
  { label: '7 dias', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 dias', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '3 meses', ms: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 meses', ms: 180 * 24 * 60 * 60 * 1000 },
  { label: '1 ano', ms: 365 * 24 * 60 * 60 * 1000 },
  { label: '2 anos', ms: 2 * 365 * 24 * 60 * 60 * 1000 },
  { label: '5 anos', ms: 5 * 365 * 24 * 60 * 60 * 1000 },
];

function humanRemaining(targetLocal: string): string {
  const target = new Date(targetLocal).getTime();
  const now = Date.now();
  const diff = target - now;
  if (isNaN(target) || diff <= 0) return 'expirada';
  const min = 60_000, hr = 60 * min, day = 24 * hr, year = 365 * day;
  if (diff >= year) return `${Math.floor(diff / year)} ano(s)`;
  if (diff >= day) return `${Math.floor(diff / day)} dia(s)`;
  if (diff >= hr) return `${Math.floor(diff / hr)} hora(s)`;
  if (diff >= min) return `${Math.floor(diff / min)} minuto(s)`;
  return 'menos de 1 minuto';
}

export const LicenseGenerator: React.FC = () => {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [licenseKey, setLicenseKey] = useState(randomLicense());
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [plan, setPlan] = useState<OfflinePlan>('pro');
  const [generating, setGenerating] = useState(false);
  const [inspectResult, setInspectResult] = useState<OfflineLicensePayload | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!clientName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome do cliente.', variant: 'destructive' });
      return;
    }
    const expiresDate = new Date(expiresAt);
    if (isNaN(expiresDate.getTime()) || expiresDate.getTime() <= Date.now() + 60_000) {
      toast({ title: 'Validade inválida', description: 'Defina ao menos 1 minuto no futuro.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const payload: OfflineLicensePayload = {
        plan,
        client_name: clientName.trim(),
        license_key: licenseKey,
        expires_at: expiresDate.toISOString(),
        generated_at: new Date().toISOString(),
      };
      const encrypted = await encryptLicense(payload);
      const blob = new Blob([encrypted as unknown as BlobPart], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${slug(clientName)}.xlata`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      toast({ title: '✅ Licença gerada', description: 'Envie o arquivo para o cliente substituir na pasta xlata-pdv-offline/.' });
    } catch (e: any) {
      toast({ title: 'Erro ao gerar', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleInspect = async (file: File) => {
    setInspectError(null);
    setInspectResult(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const payload = await decryptLicense(buf);
      setInspectResult(payload);
    } catch (e: any) {
      setInspectError(e.message || 'Falha ao decifrar arquivo.');
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Licenças Offline</h2>
          <p className="text-sm text-muted-foreground">
            Gere apenas o arquivo <code>license.xlata</code> para renovar clientes existentes
            sem reinstalar o sistema.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-500" />
            Renovar / Reemitir licença
            <Badge className={cn('ml-2', plan === 'pro' ? 'bg-emerald-600' : 'bg-slate-600')}>
              {plan === 'pro' ? 'Pro Offline' : 'Essencial Offline'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Plano</Label>
            <RadioGroup
              value={plan}
              onValueChange={(v) => setPlan(v as OfflinePlan)}
              className="grid gap-3 md:grid-cols-2"
            >
              {(['essencial', 'pro'] as OfflinePlan[]).map((p) => {
                const selected = plan === p;
                const isPro = p === 'pro';
                return (
                  <label
                    key={p}
                    htmlFor={`lic-plan-${p}`}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 p-4 transition-all',
                      selected
                        ? isPro ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-400 bg-slate-400/5'
                        : 'border-border hover:border-muted-foreground/40'
                    )}
                  >
                    <RadioGroupItem id={`lic-plan-${p}`} value={p} className="sr-only" />
                    <div className="flex items-center gap-2">
                      {isPro
                        ? <Crown className="w-4 h-4 text-emerald-500" />
                        : <Sparkles className="w-4 h-4 text-slate-400" />}
                      <span className="font-semibold text-sm">
                        {isPro ? 'Pro Offline' : 'Essencial Offline'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lic-client">Nome do cliente</Label>
              <Input
                id="lic-client"
                placeholder="Ex.: Ferro Velho do João"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lic-key" className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Chave de licença
              </Label>
              <div className="flex gap-2">
                <Input
                  id="lic-key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={() => setLicenseKey(randomLicense())}>
                  Gerar
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="lic-expires">Nova validade</Label>
                <span className="text-xs text-muted-foreground">
                  Faltam: <strong className="text-emerald-500">{humanRemaining(expiresAt)}</strong>
                </span>
              </div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="lic-expires"
                  type="datetime-local"
                  className="pl-10"
                  value={expiresAt}
                  min={toLocalInput(new Date(Date.now() + 60_000))}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground self-center mr-1">Atalhos:</span>
                {QUICK_DURATIONS.map((d) => (
                  <Button
                    key={d.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setExpiresAt(toLocalInput(new Date(Date.now() + d.ms)))}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Alert className="border-emerald-600/30 bg-emerald-600/5">
            <Lock className="h-4 w-4 text-emerald-500" />
            <AlertTitle>Encriptação AES-256-GCM + HMAC-SHA256</AlertTitle>
            <AlertDescription className="text-sm">
              O arquivo gerado é cifrado e assinado. Tentar editar com bloco de
              notas invalida a assinatura e o PDV bloqueia o acesso. O cliente
              deve apenas <strong>substituir</strong> o <code>license.xlata</code> na
              raiz de <code>xlata-pdv-offline/</code> e reiniciar o servidor.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            {generating ? <>Gerando...</> : <><Download className="w-4 h-4 mr-2" />Gerar license.xlata</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-500" />
            Verificar licença existente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faça upload de um <code>license.xlata</code> para inspecionar o conteúdo
            (cliente, plano, validade) e confirmar que a assinatura é válida.
          </p>
          <Label
            htmlFor="lic-inspect"
            className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-emerald-500/40 transition-colors"
          >
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Selecionar arquivo .xlata</span>
            <input
              id="lic-inspect"
              type="file"
              accept=".xlata,application/octet-stream"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleInspect(f);
              }}
            />
          </Label>

          {inspectError && (
            <Alert variant="destructive">
              <AlertTitle>Licença inválida</AlertTitle>
              <AlertDescription className="text-sm">{inspectError}</AlertDescription>
            </Alert>
          )}

          {inspectResult && (
            <Alert className="border-emerald-600/30 bg-emerald-600/5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <AlertTitle>Assinatura válida</AlertTitle>
              <AlertDescription className="text-sm space-y-1 mt-2">
                <div><strong>Cliente:</strong> {inspectResult.client_name}</div>
                <div><strong>Plano:</strong> {inspectResult.plan}</div>
                <div><strong>Chave:</strong> <code className="font-mono">{inspectResult.license_key}</code></div>
                <div>
                  <strong>Expira:</strong>{' '}
                  {new Date(inspectResult.expires_at).toLocaleString('pt-BR')}
                  {' '}
                  ({humanRemaining(toLocalInput(new Date(inspectResult.expires_at)))})
                </div>
                <div>
                  <strong>Gerada:</strong>{' '}
                  {new Date(inspectResult.generated_at).toLocaleString('pt-BR')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseGenerator;
