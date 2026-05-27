import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Loader2, Gift, Users, Percent, RefreshCw, Info } from 'lucide-react';

interface ReferralSetting {
  id: string;
  plan_type: string;
  plan_label: string;
  bonus_days: number;
  renewal_percentage: number;
  is_active: boolean;
  display_order: number;
}

export function AdminReferralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReferralSetting[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading referral settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar cada configuração individualmente
      for (const setting of settings) {
        const { error } = await supabase
          .from('referral_settings')
          .update({
            bonus_days: setting.bonus_days,
            renewal_percentage: setting.renewal_percentage,
            is_active: setting.is_active,
            plan_label: setting.plan_label,
            updated_at: new Date().toISOString(),
          })
          .eq('id', setting.id);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (id: string, field: keyof ReferralSetting, value: any) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getRenewalDays = (bonusDays: number, renewalPercentage: number) => {
    return Math.ceil(bonusDays * (renewalPercentage / 100));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            Configurações do Sistema de Indicações
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure os dias de bônus concedidos ao indicador quando um indicado ativar ou renovar planos.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Informações sobre o sistema */}
      <Card className="bg-emerald-900/20 border-emerald-700/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-200">
              <p className="font-medium mb-2">Como funciona o sistema de indicações:</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-300/80">
                <li>Quando um indicado ativa seu primeiro plano, o indicador recebe os <strong>dias de bônus completos</strong>.</li>
                <li>Quando o indicado renova o plano, o indicador recebe uma <strong>porcentagem do bônus</strong> (renovação).</li>
                <li>Os dias são adicionados automaticamente à assinatura do indicador.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de configurações */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Bônus por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header da tabela */}
            <div className="grid grid-cols-12 gap-4 text-xs text-slate-400 font-medium pb-2 border-b border-slate-700">
              <div className="col-span-2">Plano</div>
              <div className="col-span-2">Label</div>
              <div className="col-span-2 flex items-center gap-1">
                <Gift className="w-3 h-3" /> Dias Bônus
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <Percent className="w-3 h-3" /> % Renovação
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Dias Renovação
              </div>
              <div className="col-span-2">Ativo</div>
            </div>

            {/* Linhas de configuração */}
            {settings.map((setting) => (
              <div 
                key={setting.id} 
                className={`grid grid-cols-12 gap-4 items-center py-3 rounded-lg ${
                  setting.is_active ? 'bg-slate-700/50' : 'bg-slate-800/50 opacity-60'
                }`}
              >
                <div className="col-span-2">
                  <span className="text-white font-medium text-sm">{setting.plan_type}</span>
                </div>
                <div className="col-span-2">
                  <Input
                    value={setting.plan_label}
                    onChange={(e) => updateSetting(setting.id, 'plan_label', e.target.value)}
                    className="bg-slate-600 border-slate-500 text-white h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={0}
                    value={setting.bonus_days}
                    onChange={(e) => updateSetting(setting.id, 'bonus_days', parseInt(e.target.value) || 0)}
                    className="bg-slate-600 border-slate-500 text-white h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={setting.renewal_percentage}
                      onChange={(e) => updateSetting(setting.id, 'renewal_percentage', parseInt(e.target.value) || 0)}
                      className="bg-slate-600 border-slate-500 text-white h-8 text-sm w-16"
                    />
                    <span className="text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-cyan-400 font-medium text-sm">
                    {getRenewalDays(setting.bonus_days, setting.renewal_percentage)} dias
                  </span>
                </div>
                <div className="col-span-2">
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) => updateSetting(setting.id, 'is_active', checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview da tabela pública */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Preview - Tabela Pública
          </CardTitle>
          <CardDescription className="text-slate-400">
            Como os usuários verão a tabela de bônus no sistema de indicações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
            <h4 className="text-emerald-200 font-medium mb-3">Tabela de Bônus por Plano</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {settings.filter(s => s.is_active).map((setting) => (
                <div key={setting.id} className="bg-slate-800/50 rounded p-2 text-center">
                  <p className="text-slate-400">{setting.plan_label}</p>
                  <p className="text-emerald-300 font-bold">+{setting.bonus_days} dias</p>
                </div>
              ))}
              <div className="bg-cyan-900/30 rounded p-2 text-center col-span-2 sm:col-span-4">
                <p className="text-cyan-400">
                  Renovação = {settings[0]?.renewal_percentage || 50}% do bônus
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="pt-4">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
