
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ReceiptFormatSettings {
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

export const useReceiptFormatSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<'50mm' | '80mm', ReceiptFormatSettings>>(defaultSettings);
  const [loading, setLoading] = useState(true);

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
        const userSettings = { ...defaultSettings };
        
        data.forEach((setting) => {
          if (setting.format === '50mm' || setting.format === '80mm') {
            userSettings[setting.format] = setting as ReceiptFormatSettings;
          }
        });
        
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormatSettings = (format: '50mm' | '80mm'): ReceiptFormatSettings => {
    return settings[format] || defaultSettings[format];
  };

  // Nova função para obter o formato atual salvo no localStorage
  const getCurrentFormat = (): '50mm' | '80mm' => {
    const savedFormat = localStorage.getItem('receiptFormat') as '50mm' | '80mm' | null;
    return savedFormat || '80mm'; // padrão 80mm se não houver configuração salva
  };

  // Nova função para obter as configurações do formato atual
  const getCurrentFormatSettings = (): ReceiptFormatSettings => {
    const currentFormat = getCurrentFormat();
    return getFormatSettings(currentFormat);
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  return {
    settings,
    loading,
    getFormatSettings,
    getCurrentFormat,
    getCurrentFormatSettings,
    refreshSettings: loadSettings
  };
};
