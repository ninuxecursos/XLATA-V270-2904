import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot, Save, Loader2, Settings, Wifi, WifiOff, CheckCircle, Key, Eye, EyeOff,
  FileText, Search, MapPin, TrendingUp, Brain, Rocket, PenTool, BarChart3,
  RefreshCw, ShoppingBag, Image, Zap
} from 'lucide-react';

const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  'file-text': <FileText className="w-4 h-4" />,
  'search': <Search className="w-4 h-4" />,
  'map-pin': <MapPin className="w-4 h-4" />,
  'key': <Key className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />,
  'brain': <Brain className="w-4 h-4" />,
  'rocket': <Rocket className="w-4 h-4" />,
  'pen-tool': <PenTool className="w-4 h-4" />,
  'bar-chart': <BarChart3 className="w-4 h-4" />,
  'refresh-cw': <RefreshCw className="w-4 h-4" />,
  'shopping-bag': <ShoppingBag className="w-4 h-4" />,
  'image': <Image className="w-4 h-4" />,
  'bot': <Bot className="w-4 h-4" />,
};

interface SectorConfig {
  id: string;
  sector_key: string;
  sector_label: string;
  sector_icon: string;
  api_key: string | null;
  ai_model: string;
  is_active: boolean;
  use_global_key: boolean;
}

export function AISectorConfigPanel() {
  const [sectors, setSectors] = useState<SectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [globalApiKey, setGlobalApiKey] = useState('');

  useEffect(() => {
    loadSectors();
    loadGlobalKey();
  }, []);

  const loadGlobalKey = async () => {
    const { data } = await supabase.from('ai_automation_config').select('gemini_api_key').single();
    if (data?.gemini_api_key) setGlobalApiKey(data.gemini_api_key);
  };

  const loadSectors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_sector_config')
      .select('*')
      .order('sector_label');
    
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar configurações', variant: 'destructive' });
    } else {
      setSectors((data as any[]) || []);
    }
    setLoading(false);
  };

  const updateSector = async (id: string, updates: Partial<SectorConfig>) => {
    setSaving(id);
    const { error } = await supabase
      .from('ai_sector_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Salvo', description: 'Configuração atualizada' });
      setSectors(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
    setSaving(null);
  };

  const applyGlobalToAll = async () => {
    setSaving('all');
    const { error } = await supabase
      .from('ai_sector_config')
      .update({ use_global_key: true, updated_at: new Date().toISOString() })
      .neq('id', '');
    
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao aplicar', variant: 'destructive' });
    } else {
      toast({ title: 'Aplicado', description: 'Todos os setores agora usam a API global' });
      loadSectors();
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">IA por Setor</h2>
            <p className="text-sm text-muted-foreground">Configure API e modelo para cada funcionalidade</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applyGlobalToAll}
          disabled={saving === 'all'}
          className="border-border"
        >
          {saving === 'all' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          Aplicar global a todos
        </Button>
      </div>

      {/* Global API indicator */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm">
          <Key className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">API Global:</span>
          {globalApiKey ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" /> Configurada
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              Não configurada
            </Badge>
          )}
          <span className="text-muted-foreground ml-2">
            (configurada em "IA & Automação")
          </span>
        </div>
      </div>

      {/* Sectors grid */}
      <div className="grid gap-3">
        {sectors.map((sector) => (
          <SectorCard
            key={sector.id}
            sector={sector}
            saving={saving === sector.id}
            hasGlobalKey={!!globalApiKey}
            onUpdate={(updates) => updateSector(sector.id, updates)}
          />
        ))}
      </div>
    </div>
  );
}

function SectorCard({ sector, saving, hasGlobalKey, onUpdate }: {
  sector: SectorConfig;
  saving: boolean;
  hasGlobalKey: boolean;
  onUpdate: (updates: Partial<SectorConfig>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(sector.api_key || '');
  const [model, setModel] = useState(sector.ai_model);
  const [useGlobal, setUseGlobal] = useState(sector.use_global_key);

  const icon = SECTOR_ICONS[sector.sector_icon] || SECTOR_ICONS['bot'];
  const apiSource = useGlobal ? 'Global' : (sector.api_key ? 'Própria' : 'Nenhuma');

  return (
    <div className={`bg-card border rounded-lg transition-all ${sector.is_active ? 'border-border' : 'border-border/50 opacity-60'}`}>
      {/* Compact row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sector.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{sector.sector_label}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
              useGlobal && hasGlobalKey ? 'bg-green-500/10 text-green-400 border-green-500/30' :
              !useGlobal && sector.api_key ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
              'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {apiSource}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{model}</span>
        </div>
        <Switch
          checked={sector.is_active}
          onCheckedChange={(checked) => onUpdate({ is_active: checked })}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Expanded config */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Use global key toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-foreground">Usar API Global</span>
              <p className="text-xs text-muted-foreground">Usa a API configurada em "IA & Automação"</p>
            </div>
            <Switch
              checked={useGlobal}
              onCheckedChange={(checked) => {
                setUseGlobal(checked);
                onUpdate({ use_global_key: checked });
              }}
            />
          </div>

          {/* Custom API key - only if not using global */}
          {!useGlobal && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key própria</label>
              <div className="flex gap-2">
                <PasswordInput
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Cole sua API Key..."
                  className="bg-background border-border text-foreground"
                />
                <Button
                  size="sm"
                  onClick={() => onUpdate({ api_key: localApiKey })}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Model selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Modelo</label>
            <Select value={model} onValueChange={(v) => { setModel(v); onUpdate({ ai_model: v }); }}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
