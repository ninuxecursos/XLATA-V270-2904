import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Cable, Wifi, Usb, Plug, Activity, Save, Play, Square, Download, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ScaleConfig, ScaleProfile, ScaleReading, parseFrame, toHex } from '@/lib/scale/types';
import { createDriver, WebSerialDriver, QzTrayDriver } from '@/lib/scale/scaleAdapter';

const TRANSPORT_LABELS: Record<string, { label: string; icon: any; help: string }> = {
  web_serial: { label: 'USB / Serial (navegador)', icon: Usb, help: 'Recomendado para PCs com Chrome/Edge. Plugue a balança via USB ou serial.' },
  qz_tray: { label: 'QZ Tray (serial avançado)', icon: Plug, help: 'Use se já tiver QZ Tray instalado para impressoras.' },
  tcp: { label: 'Rede TCP/IP', icon: Wifi, help: 'Para balanças com Ethernet/Wi-Fi. Informe IP e porta.' },
};

export default function ScaleIntegrationPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ScaleProfile[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [config, setConfig] = useState<ScaleConfig>({
    nickname: 'Minha balança',
    transport: 'web_serial',
    baud_rate: 9600,
    data_bits: 8,
    parity: 'none',
    stop_bits: 1,
    request_byte: 5,
    frame_regex: '\\x02(\\d{6})\\x03',
    weight_divisor: 1000,
    unit: 'kg',
    decimal_places: 3,
    is_default: true,
    pdv_input_mode: 'manual',
  });

  const [driver, setDriver] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [readings, setReadings] = useState<ScaleReading[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qzPorts, setQzPorts] = useState<string[]>([]);
  const [existingDefaultId, setExistingDefaultId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('select');

  const isAutomatic = (config.pdv_input_mode ?? 'manual') === 'automatic';

  const brands = useMemo(() => Array.from(new Set(profiles.map(p => p.brand))), [profiles]);
  const modelsForBrand = useMemo(() => profiles.filter(p => p.brand === selectedBrand), [profiles, selectedBrand]);

  useEffect(() => { loadProfiles(); loadConfigs(); loadLogs(); }, [user]);

  async function loadProfiles() {
    const { data } = await supabase.from('scale_profiles').select('*').eq('is_active', true).order('brand').order('model');
    setProfiles((data || []) as any);
  }
  async function loadConfigs() {
    if (!user) return;
    const { data } = await supabase.from('user_scale_configs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setConfigs(data || []);
    const def = (data || []).find((c: any) => c.is_default);
    if (def) {
      setExistingDefaultId(def.id);
      setConfig((prev) => ({ ...prev, ...(def as any) }));
      if (def.profile_id) setSelectedProfileId(def.profile_id);
    }
  }
  async function loadLogs() {
    if (!user) return;
    const { data } = await supabase.from('scale_test_logs').select('*').eq('user_id', user.id).order('tested_at', { ascending: false }).limit(50);
    setLogs(data || []);
  }

  function applyProfile(profileId: string) {
    setSelectedProfileId(profileId);
    const p = profiles.find(x => x.id === profileId);
    if (!p) return;
    setConfig(c => ({
      ...c,
      profile_id: p.id,
      transport: (p.transport === 'tcp' ? 'tcp' : 'web_serial') as any,
      baud_rate: p.default_baud_rate,
      data_bits: p.data_bits,
      parity: p.parity as any,
      stop_bits: p.stop_bits,
      request_byte: p.request_byte,
      frame_regex: p.frame_regex,
      weight_divisor: Number(p.weight_divisor),
      tcp_port: p.default_tcp_port ?? c.tcp_port,
    }));
  }

  async function loadQzPorts() {
    try {
      const ports = await QzTrayDriver.listPorts();
      setQzPorts(ports);
      toast({ title: 'Portas detectadas', description: `${ports.length} porta(s) encontrada(s).` });
    } catch (e: any) {
      toast({ title: 'QZ Tray', description: e.message, variant: 'destructive' });
    }
  }

  async function handleConnect() {
    setErrorMsg(null); setReadings([]); setWeight(null);
    try {
      const d = createDriver(config);
      d.onReading((r) => {
        setWeight(r.weight);
        setReadings((prev) => [r, ...prev].slice(0, 20));
      });
      d.onError((e) => setErrorMsg(e.message));
      await d.connect();
      setDriver(d);
      setConnected(true);
      toast({ title: 'Conectado', description: 'Balança conectada com sucesso.' });
    } catch (e: any) {
      setErrorMsg(e.message);
      toast({ title: 'Erro ao conectar', description: e.message, variant: 'destructive' });
    }
  }

  async function handleDisconnect() {
    if (driver) { await driver.disconnect().catch(() => {}); setDriver(null); }
    setConnected(false);
  }

  async function handleRequestWeight() {
    try { await driver?.requestWeight?.(); }
    catch (e: any) { setErrorMsg(e.message); }
  }

  async function handleSave(asDefault = true) {
    if (!user) return;
    if (asDefault && existingDefaultId) {
      // Atualiza a config default existente preservando id e histórico
      const { id: _id, ...rest } = config as any;
      const { error } = await supabase.from('user_scale_configs').update({ ...rest, is_default: true }).eq('id', existingDefaultId);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Salvo', description: 'Configuração atualizada.' });
      loadConfigs();
      return;
    }
    const payload = { ...config, user_id: user.id, is_default: asDefault } as any;
    if (asDefault) {
      await supabase.from('user_scale_configs').update({ is_default: false }).eq('user_id', user.id);
    }
    const { error } = await supabase.from('user_scale_configs').insert(payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Salvo', description: 'Configuração salva.' });
    loadConfigs();
  }

  // Auto-desconectar quando troca para Manual
  useEffect(() => {
    if (!isAutomatic && connected) {
      handleDisconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutomatic]);

  async function handleSaveTestLog(success: boolean, raw?: string, parsed?: number, err?: string) {
    if (!user) return;
    await supabase.from('scale_test_logs').insert({
      user_id: user.id, success, raw_data: raw ?? null, parsed_weight: parsed ?? null, error_message: err ?? null,
    } as any);
    loadLogs();
  }

  async function handleDeleteConfig(id: string) {
    await supabase.from('user_scale_configs').delete().eq('id', id);
    loadConfigs();
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    await supabase.from('user_scale_configs').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('user_scale_configs').update({ is_default: true }).eq('id', id);
    loadConfigs();
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `scale-test-logs-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const TIcon = TRANSPORT_LABELS[config.transport]?.icon ?? Cable;

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Cable className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Integração de Balança</h1>
          <p className="text-sm text-muted-foreground">Conecte qualquer balança Toledo, Filizola, Urano, Welmy, Elgin ou genérica.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="select">1. Selecionar</TabsTrigger>
          <TabsTrigger value="test">2. Conectar e Testar</TabsTrigger>
          <TabsTrigger value="advanced">3. Avançado</TabsTrigger>
          <TabsTrigger value="saved">Minhas balanças</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
        </TabsList>

        {/* ABA 1 */}
        <TabsContent value="select" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Modo de inserção no PDV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                {([
                  { v: 'manual', t: 'Manual (digitação)', d: 'O operador digita o peso no teclado numérico do PDV. Comportamento padrão.' },
                  { v: 'automatic', t: 'Automático (balança)', d: 'O peso vem em tempo real da balança. O teclado do PDV fica bloqueado.' },
                ] as const).map(opt => {
                  const active = (config.pdv_input_mode ?? 'manual') === opt.v;
                  return (
                    <button key={opt.v} type="button"
                      onClick={() => setConfig(c => ({ ...c, pdv_input_mode: opt.v }))}
                      className={`p-4 rounded-xl border text-left transition ${active ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'}`}>
                      <div className="font-medium text-sm">{opt.t}</div>
                      <div className="text-xs text-muted-foreground mt-1">{opt.d}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSave(true)} variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />Salvar modo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={!isAutomatic ? 'opacity-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Escolha sua balança</span>
                {!isAutomatic && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Disponível apenas no modo Automático
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset disabled={!isAutomatic} className={`space-y-4 ${!isAutomatic ? 'pointer-events-none' : ''}`}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Marca</Label>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={!isAutomatic}>
                      <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                      <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select value={selectedProfileId} onValueChange={applyProfile} disabled={!selectedBrand || !isAutomatic}>
                      <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                      <SelectContent>{modelsForBrand.map(m => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Modo de comunicação</Label>
                  <div className="grid md:grid-cols-3 gap-3 mt-2">
                    {(['web_serial', 'qz_tray', 'tcp'] as const).map(t => {
                      const Info = TRANSPORT_LABELS[t];
                      const Icon = Info.icon;
                      const active = config.transport === t;
                      return (
                        <button key={t} type="button" disabled={!isAutomatic}
                          onClick={() => setConfig(c => ({ ...c, transport: t }))}
                          className={`p-4 rounded-xl border text-left transition ${active ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'}`}>
                          <Icon className="w-5 h-5 mb-2" />
                          <div className="font-medium text-sm">{Info.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{Info.help}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Apelido</Label>
                  <Input value={config.nickname} onChange={(e) => setConfig(c => ({ ...c, nickname: e.target.value }))} placeholder="Ex: Balança Caixa 1" />
                </div>

                {config.transport === 'tcp' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Host / IP</Label>
                      <Input value={config.tcp_host || ''} onChange={(e) => setConfig(c => ({ ...c, tcp_host: e.target.value }))} placeholder="192.168.0.50" />
                    </div>
                    <div>
                      <Label>Porta</Label>
                      <Input type="number" value={config.tcp_port || ''} onChange={(e) => setConfig(c => ({ ...c, tcp_port: Number(e.target.value) }))} placeholder="9001" />
                    </div>
                  </div>
                )}

                {config.transport === 'qz_tray' && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Porta serial (QZ Tray)</Label>
                        <Select value={config.qz_port_name || ''} onValueChange={(v) => setConfig(c => ({ ...c, qz_port_name: v }))} disabled={!isAutomatic}>
                          <SelectTrigger><SelectValue placeholder="COM3, /dev/ttyUSB0..." /></SelectTrigger>
                          <SelectContent>{qzPorts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" onClick={loadQzPorts} disabled={!isAutomatic}><RefreshCw className="w-4 h-4 mr-2" />Detectar portas</Button>
                    </div>
                  </div>
                )}

                {!WebSerialDriver.isSupported() && config.transport === 'web_serial' && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
                    Seu navegador não suporta Web Serial. Use Chrome/Edge/Opera em HTTPS, ou troque para QZ Tray / TCP.
                  </div>
                )}
              </fieldset>
              {!isAutomatic && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-sm flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Selecione "Automático (balança)" acima para configurar a balança.</span>
                  <Button size="sm" onClick={() => setConfig(c => ({ ...c, pdv_input_mode: 'automatic' }))}>
                    Ativar modo automático
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2 */}
        <TabsContent value="test" className="space-y-4 mt-4">
          {!isAutomatic ? (
            <Card><CardContent className="p-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">Teste indisponível no modo Manual</div>
                <div className="text-sm text-muted-foreground">Ative o modo Automático para conectar e testar a balança em tempo real.</div>
              </div>
              <Button onClick={() => { setConfig(c => ({ ...c, pdv_input_mode: 'automatic' })); setActiveTab('select'); }}>
                Ativar modo automático
              </Button>
            </CardContent></Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TIcon className="w-5 h-5" /> Painel de teste em tempo real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border border-emerald-500/30 p-8 text-center">
                <div className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Peso atual</div>
                <div className="text-6xl font-bold tabular-nums">
                  {weight !== null ? weight.toFixed(config.decimal_places) : '---.---'}
                  <span className="text-2xl ml-2 text-muted-foreground">{config.unit}</span>
                </div>
                <div className="mt-3">
                  <Badge variant={connected ? 'default' : 'secondary'} className={connected ? 'bg-emerald-500' : ''}>
                    {connected ? '● Conectado' : '○ Desconectado'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!connected ? (
                  <Button onClick={handleConnect}><Play className="w-4 h-4 mr-2" />Conectar</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleDisconnect}><Square className="w-4 h-4 mr-2" />Desconectar</Button>
                    {config.request_byte != null && (
                      <Button variant="outline" onClick={handleRequestWeight}><Activity className="w-4 h-4 mr-2" />Solicitar peso</Button>
                    )}
                  </>
                )}
                <Button onClick={() => handleSave(true)}><Save className="w-4 h-4 mr-2" />Salvar como padrão</Button>
                <Button variant="outline" onClick={() => handleSaveTestLog(weight != null, readings[0]?.raw, weight ?? undefined, errorMsg ?? undefined)}>
                  Registrar teste
                </Button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">{errorMsg}</div>
              )}

              <div>
                <Label>Log bruto (últimas 20 leituras)</Label>
                <div className="mt-2 rounded-lg bg-black/40 border border-border p-3 font-mono text-xs h-48 overflow-auto">
                  {readings.length === 0 && <div className="text-muted-foreground">Nenhuma leitura ainda...</div>}
                  {readings.map((r, i) => (
                    <div key={i} className="border-b border-border/30 py-1">
                      <span className="text-emerald-400">{r.weight.toFixed(config.decimal_places)} {config.unit}</span>
                      <span className="text-muted-foreground ml-2">| hex: {r.rawHex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* ABA 3 */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          {!isAutomatic ? (
            <Card><CardContent className="p-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">Configuração avançada indisponível no modo Manual</div>
                <div className="text-sm text-muted-foreground">Ative o modo Automático para ajustar baud rate, regex de frame e demais parâmetros.</div>
              </div>
              <Button onClick={() => { setConfig(c => ({ ...c, pdv_input_mode: 'automatic' })); setActiveTab('select'); }}>
                Ativar modo automático
              </Button>
            </CardContent></Card>
          ) : (
          <Card>
            <CardHeader><CardTitle>Configuração avançada</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Baud rate</Label>
                  <Select value={String(config.baud_rate)} onValueChange={(v) => setConfig(c => ({ ...c, baud_rate: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(b => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data bits</Label>
                  <Select value={String(config.data_bits)} onValueChange={(v) => setConfig(c => ({ ...c, data_bits: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[7, 8].map(b => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stop bits</Label>
                  <Select value={String(config.stop_bits)} onValueChange={(v) => setConfig(c => ({ ...c, stop_bits: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2].map(b => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paridade</Label>
                  <Select value={config.parity} onValueChange={(v) => setConfig(c => ({ ...c, parity: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="even">Par</SelectItem>
                      <SelectItem value="odd">Ímpar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Byte de requisição (decimal, vazio = contínuo)</Label>
                  <Input type="number" value={config.request_byte ?? ''} onChange={(e) => setConfig(c => ({ ...c, request_byte: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="5 = ENQ" />
                </div>
                <div>
                  <Label>Divisor de peso</Label>
                  <Select value={String(config.weight_divisor)} onValueChange={(v) => setConfig(c => ({ ...c, weight_divisor: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 10, 100, 1000].map(b => <SelectItem key={b} value={String(b)}>÷{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>Regex de leitura</Label>
                  <Input value={config.frame_regex} onChange={(e) => setConfig(c => ({ ...c, frame_regex: e.target.value }))} className="font-mono" />
                  <p className="text-xs text-muted-foreground mt-1">
                    O primeiro grupo de captura ({'(\\d+)'}) é o peso. Use \\x02, \\x03 para STX/ETX.
                  </p>
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={config.unit} onValueChange={(v) => setConfig(c => ({ ...c, unit: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Casas decimais</Label>
                  <Input type="number" min={0} max={4} value={config.decimal_places} onChange={(e) => setConfig(c => ({ ...c, decimal_places: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium text-sm">Conectar automaticamente</div>
                  <div className="text-xs text-muted-foreground">Tenta conectar à balança ao abrir o PDV.</div>
                </div>
                <Switch checked={!!config.auto_connect} onCheckedChange={(v) => setConfig(c => ({ ...c, auto_connect: v }))} />
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* ABA 4 - SAVED */}
        <TabsContent value="saved" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Balanças salvas</CardTitle></CardHeader>
            <CardContent>
              {configs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma balança salva ainda.</p>}
              <div className="space-y-2">
                {configs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {c.nickname}
                        {c.is_default && <Badge className="bg-emerald-500">Padrão</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.transport} · {c.baud_rate} baud · regex {c.frame_regex.slice(0, 30)}...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!c.is_default && <Button size="sm" variant="outline" onClick={() => handleSetDefault(c.id)}>Tornar padrão</Button>}
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteConfig(c.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 5 - DIAGNOSTICS */}
        <TabsContent value="diagnostics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Diagnóstico (últimos 50 testes)</span>
                <Button size="sm" variant="outline" onClick={exportLogs}><Download className="w-4 h-4 mr-2" />Exportar JSON</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.length === 0 && <p className="text-sm text-muted-foreground">Sem testes registrados ainda.</p>}
                {logs.map((l) => (
                  <div key={l.id} className="p-2 rounded border border-border text-xs flex justify-between">
                    <div>
                      <Badge variant={l.success ? 'default' : 'destructive'} className={l.success ? 'bg-emerald-500' : ''}>{l.success ? 'OK' : 'ERRO'}</Badge>
                      <span className="ml-2">{l.parsed_weight ?? '—'} {l.parsed_weight != null ? config.unit : ''}</span>
                      {l.error_message && <span className="ml-2 text-red-400">{l.error_message}</span>}
                    </div>
                    <span className="text-muted-foreground">{new Date(l.tested_at).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-muted/30 text-xs space-y-1">
                <div className="font-semibold">Solução de problemas</div>
                <div>• Verifique cabo (DB9 cross/null-modem para Toledo serial).</div>
                <div>• Drivers USB-Serial: FTDI ou Prolific PL2303.</div>
                <div>• Web Serial só funciona em HTTPS no Chrome/Edge/Opera.</div>
                <div>• Para balanças de rede, libere a porta no firewall e teste com telnet.</div>
                <div>• Se receber dados mas o peso não aparece, verifique o regex e o divisor na aba Avançado.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
