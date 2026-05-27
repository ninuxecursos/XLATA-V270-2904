import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Building, Image, Receipt, RotateCcw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import ReceiptPreview from './ReceiptPreview';

interface SystemSettings {
  id?: string;
  user_id: string;
  company: string;
  address: string;
  whatsapp1: string;
  whatsapp2: string;
  logo: string | null;
}

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

const defaultReceiptSettings: Record<'50mm' | '80mm', ReceiptFormatSettings> = {
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

interface UserSettingsTabProps {
  userId: string;
  userName: string;
}

const UserSettingsTab: React.FC<UserSettingsTabProps> = ({ userId, userName }) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Receipt settings
  const [receiptSettings, setReceiptSettings] = useState<Record<'50mm' | '80mm', ReceiptFormatSettings>>(defaultReceiptSettings);
  const [activeReceiptTab, setActiveReceiptTab] = useState<'50mm' | '80mm'>('80mm');
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [hasReceiptChanges, setHasReceiptChanges] = useState(false);

  useEffect(() => {
    loadSettings();
    loadReceiptSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          company: data.company || '',
          address: data.address || '',
          whatsapp1: data.whatsapp1 || '',
          whatsapp2: data.whatsapp2 || '',
          logo: data.logo,
        });
      } else {
        setSettings({
          user_id: userId,
          company: '',
          address: '',
          whatsapp1: '',
          whatsapp2: '',
          logo: null,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReceiptSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_format_settings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const userSettings = { ...defaultReceiptSettings };
        data.forEach((setting) => {
          if (setting.format === '50mm' || setting.format === '80mm') {
            userSettings[setting.format] = setting as ReceiptFormatSettings;
          }
        });
        setReceiptSettings(userSettings);
      }
    } catch (error) {
      console.error('Error loading receipt settings:', error);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: string | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleReceiptChange = (format: '50mm' | '80mm', field: keyof ReceiptFormatSettings, value: string) => {
    setReceiptSettings(prev => ({
      ...prev,
      [format]: { ...prev[format], [field]: value }
    }));
    setHasReceiptChanges(true);
  };

  const handleResetReceiptDefaults = (format: '50mm' | '80mm') => {
    setReceiptSettings(prev => ({
      ...prev,
      [format]: { ...defaultReceiptSettings[format], id: prev[format].id }
    }));
    setHasReceiptChanges(true);
    toast({ title: "Configurações resetadas", description: `Formato ${format} restaurado para valores padrão.` });
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        user_id: settings.user_id,
        company: settings.company,
        address: settings.address,
        whatsapp1: settings.whatsapp1,
        whatsapp2: settings.whatsapp2,
        logo: settings.logo,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('system_settings')
          .update(dataToSave)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert(dataToSave);
        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: `As configurações de ${userName} foram atualizadas com sucesso.`
      });
      setHasChanges(false);
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReceiptSettings = async () => {
    setSavingReceipt(true);
    try {
      for (const format of ['50mm', '80mm'] as const) {
        const settingData = {
          user_id: userId,
          format,
          container_width: receiptSettings[format].container_width,
          padding: receiptSettings[format].padding,
          margins: receiptSettings[format].margins,
          logo_max_width: receiptSettings[format].logo_max_width,
          logo_max_height: receiptSettings[format].logo_max_height,
          phone_font_size: receiptSettings[format].phone_font_size,
          address_font_size: receiptSettings[format].address_font_size,
          title_font_size: receiptSettings[format].title_font_size,
          customer_font_size: receiptSettings[format].customer_font_size,
          table_font_size: receiptSettings[format].table_font_size,
          totals_font_size: receiptSettings[format].totals_font_size,
          final_total_font_size: receiptSettings[format].final_total_font_size,
          datetime_font_size: receiptSettings[format].datetime_font_size,
          quote_font_size: receiptSettings[format].quote_font_size,
          updated_at: new Date().toISOString(),
        };

        if (receiptSettings[format].id) {
          const { error } = await supabase
            .from('receipt_format_settings')
            .update(settingData)
            .eq('id', receiptSettings[format].id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('receipt_format_settings')
            .insert(settingData);
          if (error) throw error;
        }
      }

      toast({
        title: "Configurações de comprovante salvas",
        description: `As configurações de impressão de ${userName} foram atualizadas.`
      });
      setHasReceiptChanges(false);
      loadReceiptSettings();
    } catch (error) {
      console.error('Error saving receipt settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações de comprovante.",
        variant: "destructive"
      });
    } finally {
      setSavingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Não foi possível carregar as configurações.
      </div>
    );
  }

  const currentReceiptSettings = receiptSettings[activeReceiptTab];

  return (
    <div className="space-y-4">
      {/* Save Button Header */}
      {(hasChanges || hasReceiptChanges) && (
        <div className="sticky top-0 z-10 bg-card border border-amber-500/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-medium">
            Você tem alterações não salvas
          </span>
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Config
              </Button>
            )}
            {hasReceiptChanges && (
              <Button onClick={handleSaveReceiptSettings} disabled={savingReceipt} className="bg-blue-600 hover:bg-blue-700">
                {savingReceipt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
                Salvar Comprovante
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empresa */}
        <Card className="bg-muted border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Building className="h-4 w-4 text-emerald-400" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-muted-foreground">Nome da Empresa</Label>
              <Input id="company" value={settings.company} onChange={(e) => handleChange('company', e.target.value)} placeholder="Nome da empresa" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-muted-foreground">Endereço</Label>
              <Input id="address" value={settings.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Endereço completo" className="bg-card border-border" />
            </div>
          </CardContent>
        </Card>

        {/* Contatos */}
        <Card className="bg-muted border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contatos WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp1" className="text-muted-foreground">WhatsApp Principal</Label>
              <Input id="whatsapp1" value={settings.whatsapp1} onChange={(e) => handleChange('whatsapp1', e.target.value)} placeholder="(00) 00000-0000" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp2" className="text-muted-foreground">WhatsApp Secundário</Label>
              <Input id="whatsapp2" value={settings.whatsapp2} onChange={(e) => handleChange('whatsapp2', e.target.value)} placeholder="(00) 00000-0000" className="bg-card border-border" />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="bg-muted border-border md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Image className="h-4 w-4 text-emerald-400" />
              Logotipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-muted-foreground">URL do Logotipo</Label>
              <Input id="logo" value={settings.logo || ''} onChange={(e) => handleChange('logo', e.target.value || null)} placeholder="https://exemplo.com/logo.png" className="bg-card border-border" />
            </div>
            {settings.logo && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm">Preview:</span>
                <img src={settings.logo} alt="Logo preview" className="h-12 w-auto object-contain bg-white rounded p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card className="bg-muted border-border md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between text-foreground">
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-400" />
                Configurações do Comprovante
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeReceiptTab} onValueChange={(v) => setActiveReceiptTab(v as '50mm' | '80mm')}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-card">
                  <TabsTrigger value="50mm" className="data-[state=active]:bg-blue-600">50mm</TabsTrigger>
                  <TabsTrigger value="80mm" className="data-[state=active]:bg-blue-600">80mm</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" onClick={() => handleResetReceiptDefaults(activeReceiptTab)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar Padrão
                </Button>
              </div>

              {(['50mm', '80mm'] as const).map((format) => (
                <TabsContent key={format} value={format}>
                  <div className={`${isMobileOrTablet ? 'flex flex-col gap-6' : 'grid grid-cols-2 gap-6'}`}>
                    {/* Configuration Inputs */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dimensões e Espaçamento</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Largura Container</Label>
                          <Input value={receiptSettings[format].container_width} onChange={(e) => handleReceiptChange(format, 'container_width', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Padding</Label>
                          <Input value={receiptSettings[format].padding} onChange={(e) => handleReceiptChange(format, 'padding', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Margins</Label>
                          <Input value={receiptSettings[format].margins} onChange={(e) => handleReceiptChange(format, 'margins', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Logo Largura Máx</Label>
                          <Input value={receiptSettings[format].logo_max_width} onChange={(e) => handleReceiptChange(format, 'logo_max_width', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Logo Altura Máx</Label>
                          <Input value={receiptSettings[format].logo_max_height} onChange={(e) => handleReceiptChange(format, 'logo_max_height', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                      </div>
                      
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">Tamanhos de Fonte</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Telefone</Label>
                          <Input value={receiptSettings[format].phone_font_size} onChange={(e) => handleReceiptChange(format, 'phone_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Endereço</Label>
                          <Input value={receiptSettings[format].address_font_size} onChange={(e) => handleReceiptChange(format, 'address_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Título</Label>
                          <Input value={receiptSettings[format].title_font_size} onChange={(e) => handleReceiptChange(format, 'title_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Cliente</Label>
                          <Input value={receiptSettings[format].customer_font_size} onChange={(e) => handleReceiptChange(format, 'customer_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Tabela</Label>
                          <Input value={receiptSettings[format].table_font_size} onChange={(e) => handleReceiptChange(format, 'table_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Totais</Label>
                          <Input value={receiptSettings[format].totals_font_size} onChange={(e) => handleReceiptChange(format, 'totals_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Total Final</Label>
                          <Input value={receiptSettings[format].final_total_font_size} onChange={(e) => handleReceiptChange(format, 'final_total_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Data/Hora</Label>
                          <Input value={receiptSettings[format].datetime_font_size} onChange={(e) => handleReceiptChange(format, 'datetime_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs">Citação</Label>
                          <Input value={receiptSettings[format].quote_font_size} onChange={(e) => handleReceiptChange(format, 'quote_font_size', e.target.value)} className="bg-card border-border h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview Panel */}
                    {showPreview && settings && (
                      <div className="border-l border-border pl-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview em Tempo Real</h4>
                        <ReceiptPreview
                          settings={receiptSettings[format]}
                          format={format}
                          companySettings={{
                            company: settings.company,
                            address: settings.address,
                            whatsapp1: settings.whatsapp1,
                            whatsapp2: settings.whatsapp2,
                            logo: settings.logo
                          }}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end gap-2 pt-4">
        {hasReceiptChanges && (
          <Button onClick={handleSaveReceiptSettings} disabled={savingReceipt} className="bg-blue-600 hover:bg-blue-700">
            {savingReceipt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
            Salvar Comprovante
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Config
        </Button>
      </div>
    </div>
  );
};

export default UserSettingsTab;
