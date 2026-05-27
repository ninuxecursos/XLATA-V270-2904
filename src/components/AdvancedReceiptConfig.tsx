import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, RotateCcw, Printer, Crown, Layout, Image, Type } from 'lucide-react';

interface ReceiptFormatSettings {
  id?: string;
  format: '50mm' | '80mm';
  container_width: string;
  padding: string;
  margins: string;
  logo_max_width: string;
  logo_max_height: string;
  phone_font_size: string;
  address_font_size: string;
  title_font_size: string;
  customer_font_size: string;
  table_font_size: string;
  totals_font_size: string;
  final_total_font_size: string;
  datetime_font_size: string;
  quote_font_size: string;
}

const defaultSettings: Record<'50mm' | '80mm', ReceiptFormatSettings> = {
  '50mm': {
    format: '50mm',
    container_width: '45mm',
    padding: '2mm',
    margins: '1mm 0',
    logo_max_width: '90%',
    logo_max_height: '17mm',
    phone_font_size: '14px',
    address_font_size: '12px',
    title_font_size: '13px',
    customer_font_size: '12px',
    table_font_size: '10px',
    totals_font_size: '12px',
    final_total_font_size: '16px',
    datetime_font_size: '12px',
    quote_font_size: '11px',
  },
  '80mm': {
    format: '80mm',
    container_width: '66mm',
    padding: '2mm',
    margins: '1mm 0',
    logo_max_width: '90%',
    logo_max_height: '50mm',
    phone_font_size: '22px',
    address_font_size: '13.25px',
    title_font_size: '18px',
    customer_font_size: '19.327px',
    table_font_size: '11px',
    totals_font_size: '18px',
    final_total_font_size: '22px',
    datetime_font_size: '20.124px',
    quote_font_size: '14px',
  }
};

interface AdvancedReceiptConfigProps {
  open: boolean;
  onClose: () => void;
}

const AdvancedReceiptConfig: React.FC<AdvancedReceiptConfigProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [settings50mm, setSettings50mm] = useState<ReceiptFormatSettings>(defaultSettings['50mm']);
  const [settings80mm, setSettings80mm] = useState<ReceiptFormatSettings>(defaultSettings['80mm']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'50mm' | '80mm'>('50mm');
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(data?.status === 'admin');
    } catch (error) {
      console.error('Erro ao verificar status admin:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipt_format_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach((setting) => {
          if (setting.format === '50mm') {
            setSettings50mm(setting as ReceiptFormatSettings);
          } else if (setting.format === '80mm') {
            setSettings80mm(setting as ReceiptFormatSettings);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      
      const settingsToSave = [
        { ...settings50mm, user_id: user.id },
        { ...settings80mm, user_id: user.id }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('receipt_format_settings')
          .upsert(setting, {
            onConflict: 'user_id,format'
          });

        if (error) {
          console.error('Erro ao salvar configuração:', error);
          toast({
            title: "Erro",
            description: `Erro ao salvar configurações do formato ${setting.format}`,
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações dos comprovantes foram atualizadas!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (activeTab === '50mm') {
      setSettings50mm(defaultSettings['50mm']);
    } else {
      setSettings80mm(defaultSettings['80mm']);
    }
    
    toast({
      title: "Resetado",
      description: `Configurações do formato ${activeTab} foram resetadas`,
    });
  };

  const makeDefault = async () => {
    if (!user?.id || !isAdmin) return;

    const currentSettings = activeTab === '50mm' ? settings50mm : settings80mm;

    try {
      const { error } = await supabase
        .from('receipt_format_settings')
        .upsert({
          user_id: '00000000-0000-0000-0000-000000000000',
          format: activeTab,
          container_width: currentSettings.container_width,
          padding: currentSettings.padding,
          margins: currentSettings.margins,
          logo_max_width: currentSettings.logo_max_width,
          logo_max_height: currentSettings.logo_max_height,
          phone_font_size: currentSettings.phone_font_size,
          address_font_size: currentSettings.address_font_size,
          title_font_size: currentSettings.title_font_size,
          customer_font_size: currentSettings.customer_font_size,
          table_font_size: currentSettings.table_font_size,
          totals_font_size: currentSettings.totals_font_size,
          final_total_font_size: currentSettings.final_total_font_size,
          datetime_font_size: currentSettings.datetime_font_size,
          quote_font_size: currentSettings.quote_font_size
        });

      if (error) {
        console.error('Erro ao definir padrão:', error);
        toast({
          title: "Erro",
          description: "Erro ao definir configurações como padrão",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Padrão definido!",
        description: `Configurações do formato ${activeTab} são o padrão para todos`,
      });
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir configurações como padrão",
        variant: "destructive"
      });
    }
  };

  const printTestPage = () => {
    const currentSettings = activeTab === '50mm' ? settings50mm : settings80mm;
    
    const testData = {
      customer: { name: "Cliente Teste Ltda" },
      order: {
        id: "TEST-001",
        timestamp: new Date().toISOString(),
        items: [
          { materialName: "Alumínio", quantity: 10.5, price: 3.50, total: 36.75, tara: 0.5 },
          { materialName: "Cobre", quantity: 5.2, price: 15.00, total: 78.00, tara: 0.2 }
        ],
        total: 114.75
      }
    };

    const totalWeight = testData.order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalTara = testData.order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
    const netWeight = totalWeight - totalTara;

    const printContent = `
      <div style="width: ${currentSettings.container_width}; max-width: ${currentSettings.container_width}; margin: 0; padding: ${currentSettings.padding}; font-family: 'Roboto', Arial, sans-serif; font-size: 12px; line-height: 1.3; color: #000 !important; background: #fff !important;">
        <div style="text-align: center; font-size: ${currentSettings.phone_font_size}; font-weight: bold; margin-bottom: 2mm;">
          (11) 96351-2105
        </div>
        <div style="text-align: center; font-size: ${currentSettings.address_font_size}; margin-bottom: 3mm;">
          Rua Teste, 123 - Centro - São Paulo/SP
        </div>
        <div style="text-align: center; font-weight: bold; font-size: ${currentSettings.title_font_size}; margin-bottom: 2mm;">
          COMPROVANTE DE TESTE
        </div>
        <div style="text-align: center; font-size: ${currentSettings.customer_font_size}; margin-bottom: 3mm;">
          Cliente: ${testData.customer.name}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 2mm 0;"></div>
        <table style="width: 100%; font-size: ${currentSettings.table_font_size}; margin-bottom: 2mm;">
          <thead><tr><th style="text-align: left;">Material</th><th style="text-align: right;">Peso</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>
            ${testData.order.items.map(item => `<tr><td>${item.materialName}</td><td style="text-align: right;">${item.quantity.toFixed(2)}kg</td><td style="text-align: right;">R$ ${item.total.toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div style="border-bottom: 1px dashed #000; margin: 2mm 0;"></div>
        <div style="display: flex; justify-content: space-between; font-size: ${currentSettings.totals_font_size}; margin: 1mm 0;"><span>Peso Bruto:</span><span>${totalWeight.toFixed(2)} kg</span></div>
        <div style="display: flex; justify-content: space-between; font-size: ${currentSettings.totals_font_size}; margin: 1mm 0;"><span>Total Tara:</span><span>${totalTara.toFixed(2)} kg</span></div>
        <div style="display: flex; justify-content: space-between; font-size: ${currentSettings.totals_font_size}; margin: 1mm 0;"><span>Peso Líquido:</span><span>${netWeight.toFixed(2)} kg</span></div>
        <div style="border-bottom: 1px dashed #000; margin: 2mm 0;"></div>
        <div style="text-align: right; font-weight: bold; font-size: ${currentSettings.final_total_font_size}; margin: 2mm 0;">
          Total: R$ ${testData.order.total.toFixed(2)}
        </div>
        <div style="text-align: center; font-size: ${currentSettings.datetime_font_size}; margin: 2mm 0;">
          ${new Date().toLocaleString('pt-BR')}
        </div>
        <div style="text-align: center; font-size: ${currentSettings.quote_font_size}; font-style: italic; margin-top: 3mm;">
          "O sucesso é a soma de pequenos esforços."
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Teste ${activeTab}</title><style>*{margin:0;padding:0;box-sizing:border-box;}@page{margin:0;padding:0;}html,body{margin:0!important;padding:0!important;}@media print{html,body{min-height:auto!important;height:auto!important;}}body{padding:10px;}</style></head><body>${printContent}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">Configurações de Comprovante</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white h-8 w-8 p-0">
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as '50mm' | '80mm')}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 mb-4">
              <TabsTrigger value="50mm" className="text-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-sm">
                50mm
              </TabsTrigger>
              <TabsTrigger value="80mm" className="text-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-sm">
                80mm
              </TabsTrigger>
            </TabsList>

            <TabsContent value="50mm">
              <ConfigurationForm 
                settings={settings50mm}
                onUpdate={(key, value) => setSettings50mm(prev => ({ ...prev, [key]: value }))}
              />
            </TabsContent>

            <TabsContent value="80mm">
              <ConfigurationForm 
                settings={settings80mm}
                onUpdate={(key, value) => setSettings80mm(prev => ({ ...prev, [key]: value }))}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-3 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={makeDefault} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-600/50 text-xs">
                <Crown className="h-3.5 w-3.5 mr-1" />
                Padrão
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetToDefault} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border-yellow-600/50 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Resetar
            </Button>
            <Button variant="outline" size="sm" onClick={printTestPage} className="text-slate-300 border-slate-600 hover:bg-slate-700 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              Testar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfigurationFormProps {
  settings: ReceiptFormatSettings;
  onUpdate: (key: keyof ReceiptFormatSettings, value: string) => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Layout Section */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Layout className="h-4 w-4 text-emerald-500" />
          <h4 className="text-sm font-medium text-white">Layout</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Largura</Label>
            <Input
              value={settings.container_width}
              onChange={(e) => onUpdate('container_width', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Padding</Label>
            <Input
              value={settings.padding}
              onChange={(e) => onUpdate('padding', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Margens</Label>
            <Input
              value={settings.margins}
              onChange={(e) => onUpdate('margins', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Image className="h-4 w-4 text-emerald-500" />
          <h4 className="text-sm font-medium text-white">Logo</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Largura Máx.</Label>
            <Input
              value={settings.logo_max_width}
              onChange={(e) => onUpdate('logo_max_width', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Altura Máx.</Label>
            <Input
              value={settings.logo_max_height}
              onChange={(e) => onUpdate('logo_max_height', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>

      {/* Fonts Section */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Type className="h-4 w-4 text-emerald-500" />
          <h4 className="text-sm font-medium text-white">Tamanhos de Fonte</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px] text-slate-400">Telefones</Label>
            <Input
              value={settings.phone_font_size}
              onChange={(e) => onUpdate('phone_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Endereço</Label>
            <Input
              value={settings.address_font_size}
              onChange={(e) => onUpdate('address_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Título</Label>
            <Input
              value={settings.title_font_size}
              onChange={(e) => onUpdate('title_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Cliente</Label>
            <Input
              value={settings.customer_font_size}
              onChange={(e) => onUpdate('customer_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Tabela</Label>
            <Input
              value={settings.table_font_size}
              onChange={(e) => onUpdate('table_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Totais</Label>
            <Input
              value={settings.totals_font_size}
              onChange={(e) => onUpdate('totals_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Total Final</Label>
            <Input
              value={settings.final_total_font_size}
              onChange={(e) => onUpdate('final_total_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Data/Hora</Label>
            <Input
              value={settings.datetime_font_size}
              onChange={(e) => onUpdate('datetime_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-400">Frase</Label>
            <Input
              value={settings.quote_font_size}
              onChange={(e) => onUpdate('quote_font_size', e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-600 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReceiptConfig;