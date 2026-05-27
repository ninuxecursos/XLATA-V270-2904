import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Download, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CampaignVoucherGenerator } from "./CampaignVoucherGenerator";

interface CampaignClient {
  id: string;
  name: string;
  cpf: string;
}

interface DeliveryData {
  material_name: string;
  weight_kg: number;
  price_per_kg: number;
  total_value: number;
  delivery_date: string;
}

interface PeriodSummary {
  client: CampaignClient;
  deliveries: DeliveryData[];
  totalAccumulated: number;
  finalValue: number;
  startDate: string;
  endDate: string;
}

export function PeriodClosing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<CampaignClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [accountValue, setAccountValue] = useState("");
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);

  const loadClients = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_clients')
        .select('id, name, cpf')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const calculatePeriodSummary = async () => {
    if (!user?.id || !selectedClientId) return;

    setLoading(true);
    try {
      // Buscar entregas dos últimos 30 dias
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: deliveries, error: deliveriesError } = await supabase
        .from('campaign_deliveries')
        .select(`
          weight_kg,
          price_per_kg,
          total_value,
          delivery_date,
          material_id
        `)
        .eq('user_id', user.id)
        .eq('client_id', selectedClientId)
        .gte('delivery_date', startDate.toISOString().split('T')[0])
        .lte('delivery_date', endDate.toISOString().split('T')[0])
        .order('delivery_date', { ascending: false });

      if (deliveriesError) throw deliveriesError;

      const client = clients.find(c => c.id === selectedClientId);
      if (!client) throw new Error("Cliente não encontrado");

      // Calcular totais
      const totalAccumulated = deliveries?.reduce((sum, delivery) => sum + delivery.total_value, 0) || 0;
      const finalValue = totalAccumulated * 0.8; // 80% do acumulado

      // Buscar nomes dos materiais
      const materialIds = [...new Set(deliveries?.map(d => d.material_id) || [])];
      const { data: materials } = await supabase
        .from('campaign_materials')
        .select('id, name')
        .in('id', materialIds);

      const materialMap = materials?.reduce((acc, mat) => {
        acc[mat.id] = mat.name;
        return acc;
      }, {} as Record<string, string>) || {};

      // Formatar dados das entregas
      const formattedDeliveries: DeliveryData[] = deliveries?.map(delivery => ({
        material_name: materialMap[delivery.material_id] || 'Material',
        weight_kg: delivery.weight_kg,
        price_per_kg: delivery.price_per_kg,
        total_value: delivery.total_value,
        delivery_date: delivery.delivery_date
      })) || [];

      setPeriodSummary({
        client,
        deliveries: formattedDeliveries,
        totalAccumulated,
        finalValue,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('Erro ao calcular resumo:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular resumo do período",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPeriodClosing = async () => {
    if (!user?.id || !periodSummary || !accountValue) return;

    try {
      const accountValueNum = parseFloat(accountValue);
      const discountPercentage = Math.min((periodSummary.finalValue / accountValueNum) * 100, 100);

      // Criar período fechado
      const { data: period, error: periodError } = await supabase
        .from('campaign_periods')
        .insert({
          user_id: user.id,
          client_id: selectedClientId,
          start_date: periodSummary.startDate,
          end_date: periodSummary.endDate,
          total_accumulated: periodSummary.totalAccumulated,
          final_value: periodSummary.finalValue,
          account_value: accountValueNum,
          discount_percentage: discountPercentage,
          is_closed: true,
          closed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (periodError) throw periodError;

      // Atualizar entregas com period_id
      const deliveryIds = periodSummary.deliveries.map(d => d.delivery_date);
      if (deliveryIds.length > 0) {
        const { error: updateError } = await supabase
          .from('campaign_deliveries')
          .update({ period_id: period.id })
          .eq('user_id', user.id)
          .eq('client_id', selectedClientId)
          .in('delivery_date', deliveryIds);

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: "Período fechado com sucesso"
      });

      setShowVoucher(true);
    } catch (error) {
      console.error('Erro ao fechar período:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar período",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadClients();
  }, [user?.id]);

  useEffect(() => {
    if (selectedClientId) {
      calculatePeriodSummary();
    } else {
      setPeriodSummary(null);
    }
  }, [selectedClientId]);

  const accountValueNum = parseFloat(accountValue) || 0;
  const discountPercentage = periodSummary && accountValueNum > 0 
    ? Math.min((periodSummary.finalValue / accountValueNum) * 100, 100)
    : 0;

  if (showVoucher && periodSummary) {
    return (
      <CampaignVoucherGenerator
        periodSummary={{
          ...periodSummary,
          accountValue: accountValueNum,
          discountPercentage
        }}
        onBack={() => setShowVoucher(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleção de Cliente e Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodSummary && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Período de referência:</strong> {new Date(periodSummary.startDate).toLocaleDateString('pt-BR')} até {new Date(periodSummary.endDate).toLocaleDateString('pt-BR')} (últimos 30 dias)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {periodSummary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total de Entregas</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {periodSummary.deliveries.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Acumulado</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {periodSummary.totalAccumulated.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Valor Final (80%)</p>
                        <p className="text-2xl font-bold text-purple-600">
                          R$ {periodSummary.finalValue.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {periodSummary.deliveries.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Entregas do Período:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {periodSummary.deliveries.map((delivery, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{delivery.material_name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {delivery.weight_kg}kg × R$ {delivery.price_per_kg.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">R$ {delivery.total_value.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(delivery.delivery_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {periodSummary.deliveries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma entrega encontrada nos últimos 30 dias</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {periodSummary.deliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cálculo do Desconto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="accountValue">Valor da Conta Apresentada (R$)</Label>
                  <Input
                    id="accountValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={accountValue}
                    onChange={(e) => setAccountValue(e.target.value)}
                    placeholder="Ex: 150.00"
                  />
                </div>

                {accountValueNum > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Final (80%)</p>
                        <p className="text-lg font-bold text-green-600">
                          R$ {periodSummary.finalValue.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor da Conta</p>
                        <p className="text-lg font-bold">
                          R$ {accountValueNum.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentual de Desconto</p>
                        <p className="text-lg font-bold text-purple-600">
                          {discountPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {discountPercentage >= 100 && (
                      <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded">
                        <p className="text-sm text-amber-700">
                          <strong>Atenção:</strong> O valor acumulado cobre 100% da conta!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={processPeriodClosing}
                  disabled={!accountValue || accountValueNum <= 0 || periodSummary.finalValue <= 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Fechar Período e Gerar Comprovante
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}