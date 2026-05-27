import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Users, Gift, TrendingUp, Calendar, Key, Info, Award, RotateCcw, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralData {
  indicado_id: string;
  indicado_name: string;
  indicado_email: string;
  plan_type: string;
  is_active: boolean;
  dias_recompensa: number;
  data_recompensa: string;
  tipo_bonus: string;
  numero_renovacao: number;
}

interface ReferralStats {
  total_indicados: number;
  indicados_ativos: number;
  total_dias_bonus: number;
  bonus_primeira_ativacao: number;
  bonus_renovacoes: number;
}

interface ReferralSettingData {
  plan_type: string;
  plan_label: string;
  bonus_days: number;
  renewal_percentage: number;
  is_active: boolean;
}

const ReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [refKey, setRefKey] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [referralSettings, setReferralSettings] = useState<ReferralSettingData[]>([]);

  const referralLink = refKey ? `https://xlata.site/register?ref=${refKey}` : '';

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar configurações de indicação
      const { data: settingsData, error: settingsError } = await supabase
        .from('referral_settings')
        .select('plan_type, plan_label, bonus_days, renewal_percentage, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!settingsError && settingsData) {
        setReferralSettings(settingsData);
      }

      // Buscar perfil do usuário com ref_key
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, ref_key')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      } else if (profileData) {
        setRefKey((profileData as any).ref_key || '');
        setUserName(profileData.name || '');
      }

      // Buscar estatísticas usando a nova função RPC
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_referral_stats', { p_user_id: user.id });

      if (statsError) {
        console.error('Erro ao buscar estatísticas:', statsError);
      } else if (statsData) {
        setStats(statsData as unknown as ReferralStats);
      }

      // Buscar indicados com detalhes de recompensas
      const { data: indicados, error: indicadosError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('indicador_id', user.id);

      if (indicadosError) {
        console.error('Erro ao buscar indicados:', indicadosError);
      }

      // Para cada indicado, buscar status de assinatura e recompensas
      const formattedReferrals: ReferralData[] = [];
      
      if (indicados) {
        for (const indicado of indicados) {
          // Buscar assinatura do indicado
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type, is_active, expires_at')
            .eq('user_id', indicado.id)
            .eq('is_active', true)
            .order('expires_at', { ascending: false })
            .limit(1)
            .single();

          // Buscar recompensas geradas por este indicado
          const { data: recompensas } = await supabase
            .from('recompensas_indicacao')
            .select('dias_creditados, data_credito, plano_ativado, tipo_bonus, numero_renovacao')
            .eq('user_id', user.id)
            .eq('indicado_id', indicado.id)
            .order('data_credito', { ascending: false });

          const ultimaRecompensa = recompensas?.[0];
          const totalDias = recompensas?.reduce((acc, r) => acc + (r.dias_creditados || 0), 0) || 0;

          formattedReferrals.push({
            indicado_id: indicado.id,
            indicado_name: indicado.name || 'Usuário',
            indicado_email: indicado.email || '',
            plan_type: subscription?.plan_type || '',
            is_active: subscription?.is_active && new Date(subscription?.expires_at) > new Date(),
            dias_recompensa: totalDias,
            data_recompensa: ultimaRecompensa?.data_credito || '',
            tipo_bonus: ultimaRecompensa?.tipo_bonus || '',
            numero_renovacao: recompensas?.length || 0
          });
        }
      }

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Erro ao buscar dados de indicação:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;

    try {
      setCopying(true);
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copiado!",
        description: "Seu link de indicação foi copiado para a área de transferência.",
      });
    } catch (error) {
      // Fallback
      try {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        
        toast({
          title: "Link copiado!",
          description: "Seu link de indicação foi copiado para a área de transferência.",
        });
      } catch {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link.",
          variant: "destructive",
        });
      }
    } finally {
      setCopying(false);
    }
  };

  const getPlanName = (planType: string) => {
    const plans: Record<string, string> = {
      'trial': 'Trial',
      'promotional': 'Promocional',
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'biannual': 'Semestral',
      'annual': 'Anual',
      'triennial': 'Trienal'
    };
    return plans[planType] || 'Não definido';
  };

  const getBonusDays = (planType: string, isRenewal: boolean = false) => {
    const baseDays: Record<string, number> = {
      'trial': 3,
      'promotional': 5,
      'monthly': 7,
      'quarterly': 15,
      'biannual': 30,
      'annual': 45,
      'triennial': 90
    };
    const days = baseDays[planType] || 7;
    return isRenewal ? Math.ceil(days * 0.5) : days;
  };

  const getStatusBadge = (isActive: boolean, planType: string) => {
    if (isActive && planType) {
      return <Badge className="bg-emerald-600 text-white">Ativo</Badge>;
    }
    return <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="h-24 bg-slate-700 rounded"></div>
            <div className="h-24 bg-slate-700 rounded"></div>
            <div className="h-24 bg-slate-700 rounded"></div>
          </div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Sistema de Indicações</h2>
        <p className="text-slate-400">Indique amigos e ganhe dias extras na sua assinatura!</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-slate-800/90 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <Users className="h-6 w-6 text-blue-400 mb-2" />
              <p className="text-xs text-slate-400">Indicados</p>
              <p className="text-xl font-bold text-white">{stats?.total_indicados || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/90 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="h-6 w-6 text-emerald-400 mb-2" />
              <p className="text-xs text-slate-400">Ativos</p>
              <p className="text-xl font-bold text-emerald-400">{stats?.indicados_ativos || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/90 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <Gift className="h-6 w-6 text-purple-400 mb-2" />
              <p className="text-xs text-slate-400">Total Dias</p>
              <p className="text-xl font-bold text-purple-400">{stats?.total_dias_bonus || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/90 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <Award className="h-6 w-6 text-amber-400 mb-2" />
              <p className="text-xs text-slate-400">1ª Ativação</p>
              <p className="text-xl font-bold text-amber-400">{stats?.bonus_primeira_ativacao || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/90 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-6 w-6 text-cyan-400 mb-2" />
              <p className="text-xs text-slate-400">Renovações</p>
              <p className="text-xl font-bold text-cyan-400">{stats?.bonus_renovacoes || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cálculos de Bônus e Comissões */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-purple-400" />
            Tabela de Cálculos de Bônus e Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-2 text-slate-400 font-medium">Plano do Indicado</th>
                  <th className="text-center py-3 px-2 text-emerald-400 font-medium">1ª Ativação</th>
                  <th className="text-center py-3 px-2 text-slate-400 font-medium">% Renovação</th>
                  <th className="text-center py-3 px-2 text-cyan-400 font-medium">Renovação</th>
                </tr>
              </thead>
              <tbody>
                {referralSettings.length > 0 ? (
                  referralSettings.map((setting) => (
                    <tr key={setting.plan_type} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-2 text-white font-medium">{setting.plan_label}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-emerald-300 font-bold">+{setting.bonus_days} dias</span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">{setting.renewal_percentage}%</td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-cyan-300 font-bold">
                          +{Math.ceil(setting.bonus_days * setting.renewal_percentage / 100)} dias
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Trial</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+3 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+2 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Promocional</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+5 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+3 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Mensal</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+7 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+4 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Trimestral</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+15 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+8 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Semestral</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+30 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+15 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Anual</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+45 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+23 dias</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-2 text-white font-medium">Trienal</td>
                      <td className="py-3 px-2 text-center text-emerald-300 font-bold">+90 dias</td>
                      <td className="py-3 px-2 text-center text-slate-400">50%</td>
                      <td className="py-3 px-2 text-center text-cyan-300 font-bold">+45 dias</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Legenda explicativa */}
          <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-emerald-200 space-y-1">
                <p><strong>1ª Ativação:</strong> Dias ganhos quando seu indicado ativa o primeiro plano pago.</p>
                <p><strong>Renovação:</strong> Dias ganhos a cada renovação do plano pelo indicado ({referralSettings[0]?.renewal_percentage || 50}% do bônus inicial).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chave de Referência */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            Sua Chave de Referência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {refKey ? (
            <div>
              <div className="mb-3">
                <Input
                  value={refKey}
                  readOnly
                  className="bg-slate-900 border-slate-600 text-white font-mono text-lg"
                />
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Chave única baseada no seu nome
              </div>
              {userName && (
                <p className="text-xs text-slate-500 mt-1">
                  Baseada em: {userName}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400">Sua chave será gerada automaticamente ao criar a conta</p>
              <p className="text-xs text-slate-500 mt-2">
                A chave é baseada no seu nome e é única no sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link de indicação */}
      {refKey && (
        <Card className="bg-slate-800/90 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Copy className="h-5 w-5" />
              Seu Link de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-slate-900 border-slate-600 text-white text-sm"
              />
              <Button
                onClick={copyReferralLink}
                disabled={copying}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {copying ? 'Copiando...' : 'Copiar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de indicações */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Suas Indicações</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma indicação ainda</p>
              <p className="text-sm text-slate-500 mt-2">
                Compartilhe seu link para começar a ganhar recompensas!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.indicado_id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-slate-300" />
                      </div>
                      
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {referral.indicado_name}
                        </p>
                        <p className="text-sm text-slate-400 truncate">{referral.indicado_email}</p>
                        {referral.plan_type && (
                          <p className="text-xs text-slate-500">
                            Plano: {getPlanName(referral.plan_type)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {getStatusBadge(referral.is_active, referral.plan_type)}
                      
                      {referral.dias_recompensa > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Gift className="h-3 w-3" />
                            <span className="text-sm font-medium">+{referral.dias_recompensa} dias</span>
                          </div>
                          {referral.numero_renovacao > 1 && (
                            <p className="text-xs text-cyan-400">
                              {referral.numero_renovacao}x bônus
                            </p>
                          )}
                          {referral.data_recompensa && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(referral.data_recompensa).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;