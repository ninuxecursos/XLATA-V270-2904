import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EMPLOYEE_SLOT_DEFAULT_PRICE, formatBRL } from '@/hooks/useEmployeeSlotPrice';

export function EmployeeSlotPriceCard() {
  const [price, setPrice] = useState<number>(EMPLOYEE_SLOT_DEFAULT_PRICE);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('admin_system_config')
        .select('id, employee_slot_price')
        .limit(1)
        .maybeSingle();
      if (data) {
        setConfigId((data as any).id);
        const v = (data as any).employee_slot_price;
        if (v != null) setPrice(Number(v));
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (price < 1) {
      toast.error('O valor mínimo é R$ 1,00');
      return;
    }
    setSaving(true);
    try {
      let error;
      if (configId) {
        ({ error } = await supabase
          .from('admin_system_config')
          .update({ employee_slot_price: price })
          .eq('id', configId));
      } else {
        const result = await supabase
          .from('admin_system_config')
          .insert({ employee_slot_price: price })
          .select('id')
          .single();
        error = result.error;
        if (result.data) setConfigId(result.data.id);
      }
      if (error) throw error;
      toast.success(`Valor atualizado para ${formatBRL(price)}`);
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-emerald-500" />
          Vaga de Funcionário Extra
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Este valor é cobrado mensalmente por funcionário adicional cadastrado no PDV (via PIX, acesso por 30 dias).
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...</div>
        ) : (
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1 space-y-2">
              <Label htmlFor="slot-price">Valor (R$)</Label>
              <Input
                id="slot-price"
                type="number"
                step="0.01"
                min="1"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="h-12"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Valor atual aplicado em todo o sistema: <span className="text-emerald-500 font-semibold">{formatBRL(price)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
