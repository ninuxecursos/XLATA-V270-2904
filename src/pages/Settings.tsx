import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, Eye, Settings as SettingsIcon, MessageCircle, Phone, AlertTriangle, Trash2, ShoppingCart, DollarSign, Receipt, CreditCard, Wallet, ArrowDownUp, Cable } from "lucide-react";
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdvancedReceiptConfig from "@/components/AdvancedReceiptConfig";
import { SettingsGuide, useSettingsGuide } from "@/components/onboarding/SettingsGuide";
import { useIsMobile } from "@/hooks/use-mobile";
import ClearDataSectorModal, { DataSector } from "@/components/ClearDataSectorModal";

interface SystemSettings {
  logo: string | null;
  whatsapp1: string;
  whatsapp2: string;
  address: string;
  company: string;
}

const defaultValues: SystemSettings = {
  logo: null,
  whatsapp1: "",
  whatsapp2: "",
  address: "",
  company: ""
};

function maskWhatsapp(input: string) {
  let onlyDigits = input.replace(/\D/g, "");
  if (onlyDigits.length > 0) onlyDigits = onlyDigits.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  if (onlyDigits.length > 7) onlyDigits = onlyDigits.replace(/^(\(\d{2}\) \d{5})(\d{0,4}).*/, "$1-$2");
  return onlyDigits.slice(0, 15);
}

const Settings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleSaveWithOnboarding, isOnboardingActive, currentStep } = useSettingsGuide();
  const isMobile = useIsMobile();

  const handleWhatsAppSupport = () => {
    const phoneNumber = '5511963512105';
    const message = encodeURIComponent('Olá, preciso de suporte relacionado ao sistema XLATA.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const [settings, setSettings] = useState<SystemSettings>(defaultValues);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'50mm' | '80mm'>('80mm');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Clear data sector modal state
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<DataSector>('compras');

  const handleOpenClearDataModal = (sector: DataSector) => {
    setSelectedSector(sector);
    setClearDataModalOpen(true);
  };

  const handleDataCleared = () => {
    toast({
      title: "Dados zerados",
      description: "Os dados foram removidos com sucesso.",
      duration: 3000,
    });
  };

  // Load receipt format preference from localStorage
  useEffect(() => {
    const savedFormat = localStorage.getItem('receiptFormat') as '50mm' | '80mm' | null;
    if (savedFormat) {
      setReceiptFormat(savedFormat);
    }
  }, []);

  // Save receipt format preference to localStorage
  const handleReceiptFormatChange = (format: '50mm' | '80mm') => {
    setReceiptFormat(format);
    localStorage.setItem('receiptFormat', format);
  };

  // Carregar configurações do Supabase
  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações do servidor.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const loadedSettings = {
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        };
        setSettings(loadedSettings);
        setLogoPreview(data.logo);
      } else {
        // Se não há configurações salvas, usar valores padrão
        setSettings(defaultValues);
        setLogoPreview(null);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações no Supabase
  const saveSettingsToSupabase = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Verificar se já existe configuração para este usuário
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData = {
        user_id: user.id,
        logo: settings.logo,
        whatsapp1: settings.whatsapp1,
        whatsapp2: settings.whatsapp2,
        address: settings.address,
        company: settings.company
      };

      let error;

      if (existingSettings) {
        // Atualizar configurações existentes
        const { error: updateError } = await supabase
          .from('system_settings')
          .update(settingsData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Criar novas configurações
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert(settingsData);
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar configurações no servidor.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Configurações salvas",
        description: "As informações foram atualizadas com sucesso!",
      });

      setTimeout(() => {
        // Durante o onboarding, redireciona para a próxima etapa (materiais)
        navigate(isOnboardingActive && currentStep === 1 ? "/materiais" : "/");
      }, 250);

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  // Using consistent styling with the rest of the project

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const logoData = reader.result as string;
        setSettings(prev => ({ ...prev, logo: logoData }));
        setLogoPreview(logoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (isOnboardingActive && currentStep === 1) {
      await handleSaveWithOnboarding(saveSettingsToSupabase);
    } else {
      await saveSettingsToSupabase();
    }
  };

  const handleUploadLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleWhatsapp1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, whatsapp1: maskWhatsapp(e.target.value) }));
  };

  const handleWhatsapp2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, whatsapp2: maskWhatsapp(e.target.value) }));
  };

  // Dynamic styles based on receipt format - FONTES 15% MENORES E SEM MARGENS LATERAIS PARA 50MM
  const getReceiptStyles = () => {
    if (receiptFormat === '50mm') {
      return {
        container: "bg-white text-black p-0 rounded-lg shadow-lg max-w-[200px] mx-auto text-xs",
        headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2mm", padding: "1mm" },
        logoContainer: { width: "20%", flex: "0 0 20%" },
        logoImg: { 
          maxWidth: "100%",
          maxHeight: "21mm",
          filter: "contrast(200%) brightness(0)"
        },
        infoContainer: { width: "70%", flex: "0 0 70%", textAlign: "center" as const },
        phoneNumbers: { fontSize: "13px", fontWeight: "bold" as const },
        address: { fontSize: "10px", marginTop: "1mm", fontWeight: "bold" as const, textAlign: "center" as const },
        title: "text-center font-bold text-sm mb-1 px-1",
        customer: "text-center mb-2 text-sm font-bold px-1",
        table: { width: "100%", fontSize: "8px", fontWeight: "normal" as const, padding: "0 1mm" },
        totals: { fontSize: "13px", fontWeight: "bold" as const, marginBottom: "1mm", padding: "0 1mm" },
        finalTotal: { fontWeight: "bold" as const, fontSize: "15px", textAlign: "right" as const, marginTop: "1mm", padding: "0 1mm" },
        datetime: "text-center text-sm mt-1 font-bold px-1",
        quote: "text-center text-sm mt-1 font-bold italic px-1"
      };
    } else {
      return {
        container: "bg-white text-black p-4 rounded-lg shadow-lg max-w-sm mx-auto",
        headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" },
        logoContainer: { width: "30%", flex: "0 0 30%" },
        logoImg: { 
          maxWidth: "110%",
          maxHeight: "55mm",
          filter: "contrast(200%) brightness(0)"
        },
        infoContainer: { width: "70%", flex: "0 0 70%", textAlign: "center" as const },
        phoneNumbers: { fontSize: "16px", fontWeight: "bold" as const },
        address: { fontSize: "11px", marginTop: "4px", fontWeight: "bold" as const, textAlign: "center" as const },
        title: "text-center font-bold text-lg mb-2",
        customer: "text-center mb-3 text-base font-bold",
        table: { width: "100%", fontSize: "11px", fontWeight: "bold" as const },
        totals: { fontSize: "14px", fontWeight: "bold" as const, marginBottom: "2px" },
        finalTotal: { fontWeight: "bold" as const, fontSize: "18px", textAlign: "right" as const, marginTop: "4px" },
        datetime: "text-center text-sm mt-2 font-bold",
        quote: "text-center text-xs mt-2 font-bold italic"
      };
    }
  };

  const styles = getReceiptStyles();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-base text-slate-300">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Onboarding Guide */}
      <SettingsGuide 
        settings={{ logo: settings.logo, whatsapp1: settings.whatsapp1, address: settings.address }}
        onStepComplete={() => navigate('/materiais')}
      />
      
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="icon" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                <span className="sr-only">Voltar</span>
                &larr;
              </Button>
            </Link>
            <SettingsIcon className="h-6 w-6 text-emerald-500" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              Configurações do Sistema
            </h1>
          </div>
          <ContextualHelpButton module="geral" />
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
          {/* Formulário de Configurações */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-emerald-500" />
                Configurações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              {/* Logo upload */}
              <div className="space-y-2" data-tutorial="logo-upload">
                <Label className="block text-sm text-slate-300 font-medium" htmlFor="logo">
                  Logotipo da empresa
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo da empresa"
                        className="w-20 h-20 object-contain bg-white rounded-lg border border-slate-600"
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg border-2 border-dashed border-slate-600">
                        <span className="text-xs text-center">Sem logo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/png"
                      id="logo"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                    />
                    <Button 
                      type="button" 
                      onClick={handleUploadLogoClick} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                      <Upload className="mr-2 h-4 w-4" /> 
                      Selecionar Logo
                    </Button>
                    <p className="text-xs text-slate-400 mt-1">PNG com fundo transparente</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tutorial="whatsapp-input">
                <div className="space-y-1.5">
                  <Label className="block text-sm text-slate-300 font-medium" htmlFor="whatsapp1">
                    WhatsApp 1
                  </Label>
                  <Input
                    id="whatsapp1"
                    type="tel"
                    placeholder="(11) 96351-2105"
                    value={settings.whatsapp1}
                    maxLength={15}
                    className="bg-slate-700 border-slate-600 text-emerald-400 text-base h-11 placeholder:text-slate-500"
                    onChange={handleWhatsapp1Change}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="block text-sm text-slate-300 font-medium" htmlFor="whatsapp2">
                    WhatsApp 2
                  </Label>
                  <Input
                    id="whatsapp2"
                    type="tel"
                    placeholder="(11) 92555-8555"
                    value={settings.whatsapp2}
                    maxLength={15}
                    className="bg-slate-700 border-slate-600 text-emerald-400 text-base h-11 placeholder:text-slate-500"
                    onChange={handleWhatsapp2Change}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5" data-tutorial="address-input">
                <Label className="block text-sm text-slate-300 font-medium" htmlFor="address">
                  Endereço da empresa
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua Exemplo, 123 - Centro, Cidade"
                  value={settings.address}
                  maxLength={120}
                  className="bg-slate-700 border-slate-600 text-emerald-400 text-base h-11 placeholder:text-slate-500"
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              {/* Advanced Receipt Config Button */}
              <div className="space-y-1.5" data-tutorial="receipt-format">
                <Label className="block text-sm text-slate-300 font-medium">
                  Configurações de Comprovante
                </Label>
                <Button
                  type="button"
                  onClick={() => setShowAdvancedConfig(true)}
                  variant="outline"
                  className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white h-11"
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configurações Avançadas de Comprovante
                </Button>
                <p className="text-xs text-slate-400">
                  Configure tamanhos de fonte e layout para formatos 50mm e 80mm
                </p>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold w-full h-12 mt-4"
                data-tutorial="save-button"
              >
                <Save className="mr-2 h-5 w-5" /> 
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>

          {/* Conectividades */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Cable className="h-5 w-5 text-emerald-500" />
                Conectividades
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 space-y-2">
              <p className="text-sm text-slate-400">Integre balanças, impressoras e outros dispositivos ao sistema.</p>
              <Link to="/configuracoes/balanca">
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white h-12 rounded-xl">
                  <Cable className="mr-2 h-5 w-5 text-emerald-400" />
                  Integração de Balança
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Preview do Comprovante */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-500" />
                Prévia do Comprovante
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {/* Receipt Format Selector */}
              <div className="mb-4">
                <Label className="block text-sm text-slate-300 font-medium mb-1.5">
                  Formato do Comprovante
                </Label>
                <Select value={receiptFormat} onValueChange={handleReceiptFormatChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="50mm" className="text-white hover:bg-slate-600">50mm</SelectItem>
                    <SelectItem value="80mm" className="text-white hover:bg-slate-600">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.container} style={{ fontFamily: "'Roboto', Arial, sans-serif" }}>
                {/* Header com logo e informações */}
                <div style={styles.headerFlex}>
                  <div style={styles.logoContainer}>
                    {logoPreview && (
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        style={styles.logoImg}
                      />
                    )}
                  </div>
                  
                  <div style={styles.infoContainer}>
                    <div style={styles.phoneNumbers}>
                      {settings.whatsapp1 && <div style={{ wordWrap: 'break-word' }}>{settings.whatsapp1}</div>}
                      {settings.whatsapp2 && <div style={{ marginTop: "2px", wordWrap: 'break-word' }}>{settings.whatsapp2}</div>}
                    </div>
                    {settings.address && (
                      <div style={styles.address}>
                        <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {settings.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.title}>
                  COMPROVANTE DE PEDIDO
                </div>
                
                <div className={styles.customer}>
                  Cliente: João Silva
                </div>
                
                <div style={{ borderBottom: "1px solid #000", margin: `${receiptFormat === '50mm' ? '2px 1mm' : '8px 0'}` }}></div>
                
                <div style={{ padding: receiptFormat === '50mm' ? '0 1mm' : '0' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", fontWeight: "bold" }}>Material</th>
                        <th style={{ textAlign: "right", fontWeight: "bold" }}>Peso</th>
                        <th style={{ textAlign: "right", fontWeight: "bold" }}>R$/kg</th>
                        <th style={{ textAlign: "right", fontWeight: "bold" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: "bold", wordWrap: 'break-word' }}>Alumínio</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>2,500</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>4.50</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>11.25</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div style={{ borderBottom: "1px solid #000", margin: `${receiptFormat === '50mm' ? '2px 1mm' : '8px 0'}` }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", ...styles.totals }}>
                  <span>Peso Bruto:</span>
                  <span>2,500 kg</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", ...styles.totals }}>
                  <span>Total Tara:</span>
                  <span>0,000 kg</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", ...styles.totals }}>
                  <span>Peso Líquido:</span>
                  <span>2,500 kg</span>
                </div>
                
                <div style={styles.finalTotal}>
                  Total: R$ 11.25
                </div>
                
                <div className={styles.datetime}>
                  {new Date().toLocaleString('pt-BR')}
                </div>
                
                <div className={styles.quote}>
                  "O sucesso é a soma de pequenos esforços repetidos dia após dia."
                </div>
              </div>
              
              <p className="text-xs text-slate-400 text-center mt-4">
                Esta é uma prévia de como seu comprovante aparecerá na impressão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Zerar Dados */}
        <div className="max-w-7xl mx-auto mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3 px-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Gerenciamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-sm text-slate-400 mb-4">
                Remova dados específicos do sistema. Cada setor requer confirmação e autenticação de senha.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleOpenClearDataModal('compras')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs">Compras</span>
                </Button>
                <Button
                  onClick={() => handleOpenClearDataModal('vendas')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Vendas</span>
                </Button>
                <Button
                  onClick={() => handleOpenClearDataModal('transacoes')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <Receipt className="h-5 w-5" />
                  <span className="text-xs">Transações</span>
                </Button>
                <Button
                  onClick={() => handleOpenClearDataModal('despesas')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Despesas</span>
                </Button>
                <Button
                  onClick={() => handleOpenClearDataModal('adicoes_caixa')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Adições</span>
                </Button>
                <Button
                  onClick={() => handleOpenClearDataModal('fluxo_caixa')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-600 hover:text-red-400"
                >
                  <ArrowDownUp className="h-5 w-5" />
                  <span className="text-xs">Fluxo Caixa</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Suporte - Visível apenas em Mobile */}
      {isMobile && (
        <div className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Suporte e Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <Button
                  onClick={handleWhatsAppSupport}
                  className="w-full bg-green-600 hover:bg-green-500 text-white h-12"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Falar no WhatsApp
                </Button>
                <Button
                  onClick={() => navigate('/relatar-erro')}
                  variant="outline"
                  className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 h-11"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Relatar Problema
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Atendimento de segunda a sábado, das 8h às 18h
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Advanced Receipt Configuration Modal */}
      <AdvancedReceiptConfig
        open={showAdvancedConfig}
        onClose={() => setShowAdvancedConfig(false)}
      />

      {/* Clear Data Sector Modal */}
      <ClearDataSectorModal
        open={clearDataModalOpen}
        onOpenChange={setClearDataModalOpen}
        sector={selectedSector}
        onDataCleared={handleDataCleared}
      />
    </div>
  );
};

export default Settings;
