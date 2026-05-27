import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Building2, Upload, Settings, Key, Save, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface FiscalData {
  user_id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  regime_tributario: string;
  certificado_url: string;
  certificado_senha: string;
  ambiente: string;
  proximo_numero_nfe: number;
  serie_nfe: number;
  api_empresa_id: string;
  api_token: string;
}

const EMPTY_DATA: FiscalData = {
  user_id: '',
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_estadual: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  regime_tributario: 'simples_nacional',
  certificado_url: '',
  certificado_senha: '',
  ambiente: 'homologacao',
  proximo_numero_nfe: 1,
  serie_nfe: 1,
  api_empresa_id: '',
  api_token: '',
};

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

// CNPJ mask
const maskCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// CEP mask
const maskCep = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
};

// Validate CNPJ digits
const validateCnpj = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(len));
  };
  return calc(12) && calc(13);
};

const validateCep = (cep: string): boolean => {
  return cep.replace(/\D/g, '').length === 8;
};

export const FiscalSettings = () => {
  const [tenants, setTenants] = useState<{ id: string; email: string; name: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [data, setData] = useState<FiscalData>(EMPTY_DATA);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [cepValid, setCepValid] = useState<boolean | null>(null);

  // Load tenants
  useEffect(() => {
    const loadTenants = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name');
      if (profiles) setTenants(profiles as { id: string; email: string; name: string }[]);
    };
    loadTenants();
  }, []);

  // Load fiscal data when tenant changes
  useEffect(() => {
    if (!selectedTenant) {
      setData(EMPTY_DATA);
      setExistingId(null);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      const { data: fiscal } = await supabase
        .from('fiscal_settings')
        .select('*')
        .eq('user_id', selectedTenant)
        .maybeSingle();
      if (fiscal) {
        setData({
          user_id: fiscal.user_id,
          cnpj: fiscal.cnpj || '',
          razao_social: fiscal.razao_social || '',
          nome_fantasia: fiscal.nome_fantasia || '',
          inscricao_estadual: fiscal.inscricao_estadual || '',
          logradouro: fiscal.logradouro || '',
          numero: fiscal.numero || '',
          bairro: fiscal.bairro || '',
          cidade: fiscal.cidade || '',
          uf: fiscal.uf || '',
          cep: fiscal.cep || '',
          regime_tributario: fiscal.regime_tributario || 'simples_nacional',
          certificado_url: fiscal.certificado_url || '',
          certificado_senha: fiscal.certificado_senha || '',
          ambiente: fiscal.ambiente || 'homologacao',
          proximo_numero_nfe: fiscal.proximo_numero_nfe ?? 1,
          serie_nfe: fiscal.serie_nfe ?? 1,
          api_empresa_id: fiscal.api_empresa_id || '',
          api_token: fiscal.api_token || '',
        });
        setExistingId(fiscal.id);
        setCnpjValid(fiscal.cnpj ? validateCnpj(fiscal.cnpj) : null);
        setCepValid(fiscal.cep ? validateCep(fiscal.cep) : null);
      } else {
        setData({ ...EMPTY_DATA, user_id: selectedTenant });
        setExistingId(null);
        setCnpjValid(null);
        setCepValid(null);
      }
      setLoading(false);
    };
    loadData();
  }, [selectedTenant]);

  const handleChange = (field: keyof FiscalData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleCnpjChange = (raw: string) => {
    const masked = maskCnpj(raw);
    handleChange('cnpj', masked);
    const digits = masked.replace(/\D/g, '');
    setCnpjValid(digits.length === 14 ? validateCnpj(masked) : null);
  };

  const handleCepChange = (raw: string) => {
    const masked = maskCep(raw);
    handleChange('cep', masked);
    const digits = masked.replace(/\D/g, '');
    setCepValid(digits.length === 8 ? true : null);
  };

  const fetchAddress = async () => {
    const digits = data.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const addr = await resp.json();
      if (!addr.erro) {
        setData(prev => ({
          ...prev,
          logradouro: addr.logradouro || prev.logradouro,
          bairro: addr.bairro || prev.bairro,
          cidade: addr.localidade || prev.cidade,
          uf: addr.uf || prev.uf,
        }));
        setCepValid(true);
      } else {
        setCepValid(false);
      }
    } catch {
      setCepValid(false);
    }
    setFetchingCep(false);
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenant) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pfx', 'p12'].includes(ext || '')) {
      toast({ title: 'Formato inválido', description: 'Apenas arquivos .pfx ou .p12', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const path = `${selectedTenant}/certificate.${ext}`;
    const { error } = await supabase.storage.from('certificates').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } else {
      handleChange('certificado_url', path);
      toast({ title: 'Certificado enviado', description: 'Arquivo salvo com sucesso.' });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    const payload = { ...data, user_id: selectedTenant };

    let error;
    if (existingId) {
      ({ error } = await supabase.from('fiscal_settings').update(payload).eq('id', existingId));
    } else {
      const { data: inserted, error: insertError } = await supabase.from('fiscal_settings').insert(payload).select().single();
      error = insertError;
      if (inserted) setExistingId(inserted.id);
    }

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo com sucesso', description: 'Configurações fiscais atualizadas.' });
    }
    setSaving(false);
  };

  const ValidationIcon = ({ valid }: { valid: boolean | null }) => {
    if (valid === null) return null;
    return valid
      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      : <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuração Fiscal</h2>
          <p className="text-muted-foreground text-sm">Gerencie dados fiscais por cliente (tenant)</p>
        </div>
      </div>

      {/* Tenant Selector */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Label className="text-foreground">Selecione o Cliente</Label>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Escolha um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name || t.email} — {t.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {selectedTenant && !loading && (
        <>
          {/* 1. Dados da Empresa */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="h-5 w-5" /> Dados da Empresa (Emitente)
              </CardTitle>
              <CardDescription>Informações cadastrais do CNPJ do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">CNPJ</Label>
                  <div className="relative">
                    <Input
                      value={data.cnpj}
                      onChange={e => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ValidationIcon valid={cnpjValid} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Inscrição Estadual</Label>
                  <Input value={data.inscricao_estadual} onChange={e => handleChange('inscricao_estadual', e.target.value)} placeholder="IE" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Razão Social</Label>
                  <Input value={data.razao_social} onChange={e => handleChange('razao_social', e.target.value)} placeholder="Razão Social" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Nome Fantasia</Label>
                  <Input value={data.nome_fantasia} onChange={e => handleChange('nome_fantasia', e.target.value)} placeholder="Nome Fantasia" />
                </div>
              </div>

              {/* Endereço */}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium text-foreground mb-3">Endereço</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">CEP</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={data.cep}
                          onChange={e => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <ValidationIcon valid={cepValid} />
                        </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={fetchAddress} disabled={fetchingCep}>
                        {fetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Logradouro</Label>
                    <Input value={data.logradouro} onChange={e => handleChange('logradouro', e.target.value)} placeholder="Rua, Av..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Número</Label>
                    <Input value={data.numero} onChange={e => handleChange('numero', e.target.value)} placeholder="Nº" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Bairro</Label>
                    <Input value={data.bairro} onChange={e => handleChange('bairro', e.target.value)} placeholder="Bairro" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Cidade</Label>
                    <Input value={data.cidade} onChange={e => handleChange('cidade', e.target.value)} placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">UF</Label>
                    <Select value={data.uf} onValueChange={v => handleChange('uf', v)}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Regime Tributário */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Regime Tributário</Label>
                  <Select value={data.regime_tributario} onValueChange={v => handleChange('regime_tributario', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Certificado Digital */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="h-5 w-5" /> Certificado Digital
              </CardTitle>
              <CardDescription>Upload do certificado A1 (.pfx ou .p12)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Arquivo do Certificado</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleCertUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {data.certificado_url && (
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Certificado salvo: {data.certificado_url.split('/').pop()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Senha do Certificado</Label>
                  <PasswordInput
                    value={data.certificado_senha}
                    onChange={e => handleChange('certificado_senha', e.target.value)}
                    placeholder="Senha do certificado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Configurações de Emissão */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5" /> Configurações de Emissão
              </CardTitle>
              <CardDescription>Ambiente de emissão e numeração de NF-e</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Ambiente de Emissão</p>
                  <p className="text-sm text-muted-foreground">
                    {data.ambiente === 'producao' ? '🟢 Produção — NF-e válidas' : '🟡 Homologação — Apenas testes'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Homologação</span>
                  <Switch
                    checked={data.ambiente === 'producao'}
                    onCheckedChange={checked => handleChange('ambiente', checked ? 'producao' : 'homologacao')}
                  />
                  <span className="text-sm text-foreground font-medium">Produção</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Próximo Nº NF-e</Label>
                  <Input
                    type="number"
                    min={1}
                    value={data.proximo_numero_nfe}
                    onChange={e => handleChange('proximo_numero_nfe', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Série NF-e</Label>
                  <Input
                    type="number"
                    min={1}
                    value={data.serie_nfe}
                    onChange={e => handleChange('serie_nfe', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Integração API */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Key className="h-5 w-5" /> Integração API (Admin)
              </CardTitle>
              <CardDescription>Credenciais da API de emissão de notas fiscais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">ID da Empresa na API</Label>
                  <Input
                    value={data.api_empresa_id}
                    onChange={e => handleChange('api_empresa_id', e.target.value)}
                    placeholder="ID da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Token da API</Label>
                  <PasswordInput
                    value={data.api_token}
                    onChange={e => handleChange('api_token', e.target.value)}
                    placeholder="Token de autenticação"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
