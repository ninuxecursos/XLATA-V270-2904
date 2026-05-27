import React, { useState } from 'react';
import JSZip from 'jszip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { encryptLicense } from '@/lib/offlineLicenseCrypto';
import type { OfflinePlan as OfflinePlanType } from '@/lib/offlineLicenseSecret';
import {
  Download,
  HardDrive,
  KeyRound,
  Package,
  Calendar as CalendarIcon,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react';

const TEMPLATE_URL = '/downloads/xlata-pdv-offline-template.zip';

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cliente';

const randomLicense = () => {
  const block = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `XLATA-${block()}-${block()}-${block()}`;
};

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Converte Date → string aceita por <input type="datetime-local"> (sem segundos, hora local)
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toLocalInput(d);
}

// Atalhos de validade — adiciona ms a partir de "agora"
const QUICK_DURATIONS: { label: string; ms: number }[] = [
  { label: '5 min',    ms: 5 * 60 * 1000 },
  { label: '30 min',   ms: 30 * 60 * 1000 },
  { label: '1 hora',   ms: 60 * 60 * 1000 },
  { label: '1 dia',    ms: 24 * 60 * 60 * 1000 },
  { label: '7 dias',   ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 dias',  ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '1 ano',    ms: 365 * 24 * 60 * 60 * 1000 },
  { label: '5 anos',   ms: 5 * 365 * 24 * 60 * 60 * 1000 },
  { label: '50 anos',  ms: 50 * 365 * 24 * 60 * 60 * 1000 },
  { label: '500 anos', ms: 500 * 365 * 24 * 60 * 60 * 1000 },
];

// "Faltam 5 minutos / 3 dias / 2 anos…" — para feedback ao usuário
function humanRemaining(targetLocal: string): string {
  const target = new Date(targetLocal).getTime();
  const now = Date.now();
  const diff = target - now;
  if (isNaN(target) || diff <= 0) return 'expirada';
  const min = 60_000, hr = 60 * min, day = 24 * hr, year = 365 * day;
  if (diff >= year) return `${Math.floor(diff / year)} ano(s)`;
  if (diff >= day)  return `${Math.floor(diff / day)} dia(s)`;
  if (diff >= hr)   return `${Math.floor(diff / hr)} hora(s)`;
  if (diff >= min)  return `${Math.floor(diff / min)} minuto(s)`;
  return 'menos de 1 minuto';
}

type OfflinePlan = OfflinePlanType;

const PLAN_INFO: Record<OfflinePlan, { label: string; price: string; features: string[] }> = {
  essencial: {
    label: 'Essencial Offline',
    price: 'R$ 79,90/mês',
    features: ['PDV completo', 'Produtos e categorias', 'Vendas e compras', 'Caixa básico', 'Relatório diário'],
  },
  pro: {
    label: 'Pro Offline',
    price: 'R$ 137,90/mês',
    features: ['Tudo do Essencial', 'Clientes', 'Funcionários', 'Histórico de preços', 'Despesas avançadas', 'Fechamento detalhado', 'Exportação PDF profissional'],
  },
};

export const PDVOfflineGenerator: React.FC = () => {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [licenseKey, setLicenseKey] = useState(randomLicense());
  const [plan, setPlan] = useState<OfflinePlan>('pro');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!clientName.trim() || !username.trim() || !password || !expiresAt) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome do cliente, usuário, senha e validade.',
        variant: 'destructive',
      });
      return;
    }
    if (password.length < 4) {
      toast({
        title: 'Senha muito curta',
        description: 'Use ao menos 4 caracteres.',
        variant: 'destructive',
      });
      return;
    }
    // expiresAt agora é "datetime-local" (YYYY-MM-DDTHH:mm) — precisa ser pelo menos 1 minuto no futuro
    const expiresDate = new Date(expiresAt);
    if (isNaN(expiresDate.getTime()) || expiresDate.getTime() <= Date.now() + 60_000) {
      toast({
        title: 'Validade inválida',
        description: 'A validade deve ser ao menos 1 minuto no futuro.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      // 1. Fetch base template
      const res = await fetch(TEMPLATE_URL);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'Template offline não encontrado. Rode `bash scripts/build-offline-template.sh` no terminal local para gerar o ZIP base antes de empacotar para o cliente.'
          );
        }
        throw new Error('Falha ao baixar template base');
      }
      const buf = await res.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);

      // 2. Inject personalized files (formato consumido pelo server.js)
      const expiresIso = expiresDate.toISOString();
      const license = {
        plan, // 'pro' | 'essencial' — lido por /api/license e useFeatureAccess
        client_name: clientName.trim(),
        license_key: licenseKey,
        expires_at: expiresIso,
        generated_at: new Date().toISOString(),
      };
      const credentials = {
        email: username.trim().includes('@') ? username.trim() : `${username.trim()}@xlata.local`,
        name: clientName.trim(),
        user_id: 'offline-' + slug(clientName),
        password_hash: await sha256Hex(password),
        algorithm: 'sha256',
      };

      // Folder inside zip is "xlata-pdv-offline/"
      const root = 'xlata-pdv-offline/';
      // Licença encriptada (AES-256-GCM + HMAC-SHA256) — não editável em bloco de notas.
      const encryptedLicense = await encryptLicense(license);
      zip.file(root + 'license.xlata', encryptedLicense);
      zip.file(root + 'credentials.json', JSON.stringify(credentials, null, 2));

      // 3. Personalize start.bat title with client name
      const batFile = zip.file(root + 'start.bat');
      if (batFile) {
        let bat = await batFile.async('string');
        bat = bat.replace(
          'title XLata PDV Offline',
          `title XLata PDV Offline - ${clientName.trim()}`,
        );
        zip.file(root + 'start.bat', bat);
      }

      // 4. Generate and download
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
        mimeType: 'application/zip',
      });
      const today = new Date().toISOString().slice(0, 10);
      const fileName = `xlata-pdv-${slug(clientName)}-${today}.zip`;
      const url = URL.createObjectURL(blob);

      // Anchor download (funciona em janela top-level e em iframes com allow-downloads)
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Revoga depois de tempo suficiente para o navegador iniciar o download
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      toast({
        title: '✅ Pacote gerado',
        description: `${fileName} baixado com sucesso.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao gerar',
        description: e.message || 'Não foi possível gerar o pacote offline.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">PDV Offline</h2>
          <p className="text-sm text-muted-foreground">
            Gere um pacote standalone do PDV para uso sem internet.
          </p>
        </div>
      </div>

      {/* Generator card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Gerar versão offline
            <Badge className={cn(
              "ml-2",
              plan === 'pro' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-600 hover:bg-slate-700"
            )}>
              {PLAN_INFO[plan].label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Plan selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Plano da versão offline</Label>
            <RadioGroup
              value={plan}
              onValueChange={(v) => setPlan(v as OfflinePlan)}
              className="grid gap-3 md:grid-cols-2"
            >
              {(['essencial', 'pro'] as OfflinePlan[]).map((p) => {
                const info = PLAN_INFO[p];
                const selected = plan === p;
                const isPro = p === 'pro';
                return (
                  <label
                    key={p}
                    htmlFor={`plan-${p}`}
                    className={cn(
                      "relative cursor-pointer rounded-xl border-2 p-4 transition-all",
                      selected
                        ? (isPro ? "border-emerald-500 bg-emerald-500/5" : "border-slate-400 bg-slate-400/5")
                        : "border-border hover:border-muted-foreground/40"
                    )}
                  >
                    <RadioGroupItem id={`plan-${p}`} value={p} className="sr-only" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isPro
                          ? <Crown className="w-4 h-4 text-emerald-500" />
                          : <Sparkles className="w-4 h-4 text-slate-400" />}
                        <span className="font-semibold text-sm">{info.label}</span>
                      </div>
                      {isPro && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-500">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{info.price} (equivalente)</p>
                    <ul className="text-xs space-y-0.5">
                      {info.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <CheckCircle2 className={cn(
                            "w-3 h-3 mt-0.5 shrink-0",
                            isPro ? "text-emerald-500" : "text-slate-400"
                          )} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do cliente</Label>
              <Input
                id="client-name"
                placeholder="Ex.: Ferro Velho do João"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="expires">Validade da licença</Label>
                <span className="text-xs text-muted-foreground">
                  Faltam: <strong className="text-emerald-500">{humanRemaining(expiresAt)}</strong>
                </span>
              </div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="expires"
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
            <div className="space-y-2">
              <Label htmlFor="username">Usuário de login</Label>
              <Input
                id="username"
                placeholder="Ex.: joao"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha de login</Label>
              <PasswordInput
                id="password"
                placeholder="Mínimo 4 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={64}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="license-key" className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Chave de licença
              </Label>
              <div className="flex gap-2">
                <Input
                  id="license-key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLicenseKey(randomLicense())}
                >
                  Gerar
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-emerald-600/30 bg-emerald-600/5">
            <Info className="h-4 w-4 text-emerald-500" />
            <AlertTitle>O pacote inclui</AlertTitle>
            <AlertDescription className="text-sm">
              Servidor Express + SQLite, frontend completo, login, cadastro de
              produtos, vendas, compras, histórico e relatório diário imprimível
              (PDF via navegador). Tudo embutido em um único <code>.zip</code>.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            {generating ? (
              <>Gerando pacote...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar e Baixar .zip
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-emerald-500" />
            Instruções de instalação (Windows)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Instale o <strong>Node.js LTS</strong> no computador do cliente:{' '}
              <a
                href="https://nodejs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 underline"
              >
                nodejs.org
              </a>
            </li>
            <li>
              Extraia o <code>.zip</code> em uma pasta de <strong>caminho curto e sem acentos</strong>.
              Recomendado: <code>C:\XLataPDV</code>{' '}
              <span className="text-muted-foreground">
                (evite Área de Trabalho, Downloads, OneDrive ou Program Files)
              </span>.
            </li>
            <li>Dê dois cliques em <code>start.bat</code>.</li>
            <li>
              Na primeira execução, as dependências serão baixadas automaticamente
              (necessita internet apenas neste passo, ~30s a 2min).
            </li>
            <li>
              O navegador abrirá em <code>http://localhost:3939</code>. Faça login
              com o usuário e senha definidos acima.
            </li>
            <li>
              A partir daí, o sistema funciona <strong>100% offline</strong>.
              Dados salvos em <code>data/xlata.db</code>.
            </li>
          </ol>

          <Alert className="border-blue-600/30 bg-blue-600/5 mt-4">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Se o CMD fechar sozinho ou der erro</AlertTitle>
            <AlertDescription className="text-sm space-y-1 mt-1">
              <p>
                1. Abra o arquivo <code>start.log</code> criado na mesma pasta —
                ele contém o erro exato.
              </p>
              <p>
                2. Causas mais comuns: sem internet na 1ª execução, porta{' '}
                <code>3939</code> já em uso, ou pasta sem permissão de escrita.
              </p>
              <p>
                3. Esta versão usa <strong>sql.js</strong> (SQLite em WebAssembly) —
                não precisa de Visual Studio Build Tools nem compilação nativa.
              </p>
              <p>
                4. Para reinstalar do zero: apague a pasta <code>node_modules</code>{' '}
                e rode <code>start.bat</code> novamente.
              </p>
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-600/30 bg-amber-600/5 mt-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Limitações desta versão</AlertTitle>
            <AlertDescription className="text-sm space-y-1 mt-1">
              <p>
                • Cliente final precisa ter Node.js instalado (link acima — instalação única).
              </p>
              <p>
                • Não há sincronização com a nuvem; dados ficam só no computador local.
              </p>
              <p>
                • Sem multi-usuário, sem caixa aberto/fechado, sem dashboards complexos —
                é a versão Básica focada em PDV simples e relatório diário.
              </p>
            </AlertDescription>
          </Alert>

          <Alert className="border-emerald-600/30 bg-emerald-600/5">
            <Lock className="h-4 w-4 text-emerald-500" />
            <AlertTitle>Licença encriptada (AES-256-GCM + HMAC)</AlertTitle>
            <AlertDescription className="text-sm">
              O arquivo <code>license.xlata</code> é assinado e criptografado.
              Editar com bloco de notas invalida a assinatura e o sistema
              bloqueia o acesso. Para renovar, use a página{' '}
              <strong>Licenças Offline</strong> aqui no Covildomal e gere apenas
              o novo <code>license.xlata</code> para enviar ao cliente.
            </AlertDescription>
          </Alert>

          <Alert className="border-emerald-600/30 bg-emerald-600/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertTitle>Para macOS / Linux</AlertTitle>
            <AlertDescription className="text-sm">
              Use <code>./start.sh</code> no terminal em vez de <code>start.bat</code>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDVOfflineGenerator;
