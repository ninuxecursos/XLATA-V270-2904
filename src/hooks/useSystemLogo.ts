
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SystemSettings {
  logo: string | null;
  company: string;
  whatsapp1: string;
  whatsapp2: string;
  address: string;
}

export const useSystemLogo = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        setSettings(null);
        return;
      }

      if (data) {
        setSettings({
          logo: data.logo,
          company: data.company || 'XLata.site',
          whatsapp1: data.whatsapp1 || '',
          whatsapp2: data.whatsapp2 || '',
          address: data.address || ''
        });
      } else {
        // Configurações padrão
        setSettings({
          logo: null,
          company: 'XLata.site',
          whatsapp1: '',
          whatsapp2: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  const getLogoUrl = () => {
    return settings?.logo || '/lovable-uploads/8b2acae7-5ce9-4065-9287-723822a2bfd1.png';
  };

  const getCompanyName = () => {
    return settings?.company || 'XLata.site';
  };

  return {
    settings,
    loading,
    getLogoUrl,
    getCompanyName,
    refresh: loadSettings
  };
};
