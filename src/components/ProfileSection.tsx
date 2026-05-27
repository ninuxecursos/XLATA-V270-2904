
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Save, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, company')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do perfil.",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setName(data.name || '');
        setCompany(data.company || '');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name.trim(),
          company: company.trim() || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar perfil no servidor.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar senha se fornecida
      if (password.trim()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password.trim()
        });

        if (passwordError) {
          console.error('Erro ao atualizar senha:', passwordError);
          toast({
            title: "Perfil salvo",
            description: "Perfil atualizado, mas houve erro ao alterar a senha.",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      });

      setPassword('');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const fontSizeClass = "text-[130%]";
  const inputFontSizeClass = "text-[148%] md:text-[163%]";
  const inputStyles = `bg-[#000] text-[#10B981] border-gray-500 ${inputFontSizeClass} placeholder-[#10B981]`;

  if (loading) {
    return (
      <Card className="bg-pdv-dark-light border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-white">Carregando perfil...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-pdv-dark-light border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-xl font-bold ${fontSizeClass} text-white flex items-center gap-2`}>
            <User className="h-5 w-5 text-pdv-green" />
            Meu Perfil
          </CardTitle>
          <Badge variant="destructive" className="border-red-500 text-red-500 bg-transparent">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Importante Preencher!
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className={`block ${fontSizeClass} text-white font-semibold`} htmlFor="name">
            Nome
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className={`${inputStyles} h-12`}
          />
        </div>

        <div className="space-y-2">
          <Label className={`block ${fontSizeClass} text-white font-semibold`} htmlFor="company">
            Empresa
          </Label>
          <Input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Nome da sua empresa (opcional)"
            className={`${inputStyles} h-12`}
          />
        </div>

        <div className="space-y-2">
          <Label className={`block ${fontSizeClass} text-white font-semibold`} htmlFor="password">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (deixe em branco para manter atual)"
            className={`${inputStyles} h-12`}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className={`bg-pdv-green hover:bg-pdv-green/90 text-black font-bold ${fontSizeClass} w-full h-14 mt-8`}
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? "Salvando..." : "Alterar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
