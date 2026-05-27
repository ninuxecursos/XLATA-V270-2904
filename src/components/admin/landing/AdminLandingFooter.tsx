import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, GripVertical, ExternalLink, Shield, Lock, BadgeCheck, KeyRound, ShieldCheck } from 'lucide-react';

interface FooterLink {
  label: string;
  url: string;
  is_visible: boolean;
}

interface SecurityBadge {
  icon: string;
  label: string;
  is_visible: boolean;
}

interface FooterSettings {
  id: string;
  copyright_text: string;
  links: FooterLink[];
  show_social_links: boolean;
  social_links: { platform: string; url: string }[];
  is_active: boolean;
  security_badges: SecurityBadge[];
}

const availableIcons = [
  { value: 'Shield', label: 'Escudo', icon: Shield },
  { value: 'Lock', label: 'Cadeado', icon: Lock },
  { value: 'BadgeCheck', label: 'Badge Verificado', icon: BadgeCheck },
  { value: 'KeyRound', label: 'Chave SSL', icon: KeyRound },
  { value: 'ShieldCheck', label: 'Escudo Check', icon: ShieldCheck },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Lock,
  BadgeCheck,
  KeyRound,
  ShieldCheck,
};

export function AdminLandingFooter() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [newBadge, setNewBadge] = useState({ icon: 'Shield', label: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-landing-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_footer_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        copyright_text: data.copyright_text,
        links: Array.isArray(data.links) ? (data.links as unknown as FooterLink[]) : [],
        show_social_links: data.show_social_links,
        social_links: Array.isArray(data.social_links) ? data.social_links : [],
        is_active: data.is_active,
        security_badges: Array.isArray(data.security_badges) ? (data.security_badges as unknown as SecurityBadge[]) : [],
      } as FooterSettings;
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<FooterSettings>) => {
      if (!settings?.id) {
        // Create new
        const { error } = await supabase
          .from('landing_footer_settings')
          .insert([{
            copyright_text: updatedSettings.copyright_text,
            links: JSON.parse(JSON.stringify(updatedSettings.links || [])),
            show_social_links: updatedSettings.show_social_links,
            social_links: JSON.parse(JSON.stringify(updatedSettings.social_links || [])),
            security_badges: JSON.parse(JSON.stringify(updatedSettings.security_badges || [])),
          }]);
        if (error) throw error;
      } else {
        // Update existing
        const { error } = await supabase
          .from('landing_footer_settings')
          .update({
            copyright_text: updatedSettings.copyright_text,
            links: JSON.parse(JSON.stringify(updatedSettings.links || [])),
            show_social_links: updatedSettings.show_social_links,
            social_links: JSON.parse(JSON.stringify(updatedSettings.social_links || [])),
            security_badges: JSON.parse(JSON.stringify(updatedSettings.security_badges || [])),
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-footer'] });
      toast.success('Footer salvo!');
      window.dispatchEvent(new CustomEvent('landingConfigUpdated'));
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const handleAddLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim() || !settings) return;
    
    setSettings({
      ...settings,
      links: [...settings.links, { ...newLink, is_visible: true }],
    });
    setNewLink({ label: '', url: '' });
  };

  const handleRemoveLink = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      links: settings.links.filter((_, i) => i !== index),
    });
  };

  const handleToggleLinkVisibility = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      links: settings.links.map((link, i) => 
        i === index ? { ...link, is_visible: !link.is_visible } : link
      ),
    });
  };

  const handleUpdateLink = (index: number, field: 'label' | 'url', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      links: settings.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      ),
    });
  };

  // Security Badges handlers
  const handleAddBadge = () => {
    if (!newBadge.label.trim() || !settings) return;
    
    setSettings({
      ...settings,
      security_badges: [...settings.security_badges, { ...newBadge, is_visible: true }],
    });
    setNewBadge({ icon: 'Shield', label: '' });
  };

  const handleRemoveBadge = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security_badges: settings.security_badges.filter((_, i) => i !== index),
    });
  };

  const handleToggleBadgeVisibility = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security_badges: settings.security_badges.map((badge, i) => 
        i === index ? { ...badge, is_visible: !badge.is_visible } : badge
      ),
    });
  };

  const handleUpdateBadge = (index: number, field: 'icon' | 'label', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security_badges: settings.security_badges.map((badge, i) => 
        i === index ? { ...badge, [field]: value } : badge
      ),
    });
  };

  const renderBadgeIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Shield;
    return <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Nenhuma configuração de footer encontrada.</p>
        <Button onClick={() => refetch()} className="bg-emerald-600 hover:bg-emerald-700">
          Recarregar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Configurações do Footer</h3>
        <p className="text-sm text-slate-400">Personalize o rodapé da landing page</p>
      </div>

      {/* Copyright Text */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Texto de Copyright</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={settings.copyright_text}
            onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
            placeholder="© 2025 XLata.site • Todos os direitos reservados"
            className="bg-slate-700 border-slate-600 text-white"
          />
        </CardContent>
      </Card>

      {/* Security Badges */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Selos de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Badges */}
          <div className="space-y-2">
            {settings.security_badges.map((badge, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg ${!badge.is_visible ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-slate-500" />
                <div className="flex items-center gap-2 text-emerald-500">
                  {renderBadgeIcon(badge.icon)}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Select
                    value={badge.icon}
                    onValueChange={(value) => handleUpdateBadge(index, 'icon', value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableIcons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value} className="text-white">
                          <span className="flex items-center gap-2">
                            <icon.icon className="w-4 h-4" />
                            {icon.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={badge.label}
                    onChange={(e) => handleUpdateBadge(index, 'label', e.target.value)}
                    placeholder="Nome do selo"
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <Switch 
                  checked={badge.is_visible} 
                  onCheckedChange={() => handleToggleBadgeVisibility(index)}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveBadge(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Badge */}
          <div className="flex gap-2 pt-2 border-t border-slate-600">
            <Select
              value={newBadge.icon}
              onValueChange={(value) => setNewBadge({ ...newBadge, icon: value })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value} className="text-white">
                    <span className="flex items-center gap-2">
                      <icon.icon className="w-4 h-4" />
                      {icon.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newBadge.label}
              onChange={(e) => setNewBadge({ ...newBadge, label: e.target.value })}
              placeholder="Nome do selo (ex: Site Seguro)"
              className="bg-slate-700 border-slate-600 text-white flex-1"
            />
            <Button 
              onClick={handleAddBadge}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Links do Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Links */}
          <div className="space-y-2">
            {settings.links.map((link, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg ${!link.is_visible ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-slate-500" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => handleUpdateLink(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                    placeholder="/pagina"
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <Switch 
                  checked={link.is_visible} 
                  onCheckedChange={() => handleToggleLinkVisibility(index)}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveLink(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Link */}
          <div className="flex gap-2 pt-2 border-t border-slate-600">
            <Input
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="Nome do link"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="/url-da-pagina"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button 
              onClick={handleAddLink}
              variant="outline"
              className="border-slate-600 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button 
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Footer
        </Button>
      </div>

      {/* Preview */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Preview do Footer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 rounded-lg p-6 border border-slate-800">
            {/* Security Badges Preview */}
            {settings.security_badges.filter(b => b.is_visible).length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                {settings.security_badges
                  .filter(badge => badge.is_visible)
                  .map((badge, index) => (
                    <div key={index} className="flex items-center gap-2 text-emerald-500">
                      {renderBadgeIcon(badge.icon)}
                      <span className="text-xs text-slate-400 font-medium">{badge.label}</span>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
              {settings.links
                .filter(link => link.is_visible)
                .map((link, index) => (
                  <span key={index} className="text-slate-500 hover:text-white text-sm cursor-pointer">
                    {link.label}
                  </span>
                ))}
            </div>
            <p className="text-center text-slate-600 text-sm">
              {settings.copyright_text}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
