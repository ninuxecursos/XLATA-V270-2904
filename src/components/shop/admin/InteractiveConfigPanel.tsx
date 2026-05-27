import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings, Clock, Type, Volume2, Sparkles, Save, RefreshCw, Info } from 'lucide-react';
import { useInteractiveConfig, useUpdateInteractiveConfig, useUpdateAllActiveEventsIncrement, useInteractiveEvents } from '@/hooks/useInteractiveEvents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
interface InteractiveConfigPanelProps {
  onBack: () => void;
}

export function InteractiveConfigPanel({ onBack }: InteractiveConfigPanelProps) {
  const { data: config, isLoading } = useInteractiveConfig();
  const { data: events = [] } = useInteractiveEvents({ status: 'all' });
  const updateConfig = useUpdateInteractiveConfig();
  const updateAllEvents = useUpdateAllActiveEventsIncrement();

  // Count active/scheduled events with different increment than default
  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'scheduled');
  const eventsWithDifferentIncrement = activeEvents.filter(
    e => config && e.minimum_increment !== config.default_increment
  );
  const [formData, setFormData] = useState({
    default_duration_minutes: 60,
    default_increment: 10,
    is_enabled: true,
    event_title_label: 'Oferta Interativa',
    participate_button_text: 'Participar',
    current_value_label: 'Valor Atual',
    time_remaining_label: 'Tempo Restante',
    enable_sounds: true,
    enable_animations: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        default_duration_minutes: config.default_duration_minutes,
        default_increment: config.default_increment,
        is_enabled: config.is_enabled,
        event_title_label: config.event_title_label,
        participate_button_text: config.participate_button_text,
        current_value_label: config.current_value_label,
        time_remaining_label: config.time_remaining_label,
        enable_sounds: config.enable_sounds,
        enable_animations: config.enable_animations,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    
    await updateConfig.mutateAsync({
      id: config.id,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <p className="text-gray-500">Ajuste as configurações de vendas interativas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Settings className="w-5 h-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>Ajustes padrão para novos eventos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-900 font-medium">Vendas Interativas</Label>
                <p className="text-sm text-gray-500">Ativar módulo de vendas interativas</p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
              />
            </div>

            {/* Default Duration */}
            <div className="space-y-2">
              <Label className="text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duração Padrão (minutos)
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.default_duration_minutes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  default_duration_minutes: parseInt(e.target.value) || 60 
                }))}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            {/* Default Increment */}
            <div className="space-y-2">
              <Label className="text-gray-900">Incremento Padrão (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={formData.default_increment}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  default_increment: parseFloat(e.target.value) || 10 
                }))}
                className="bg-white text-gray-900 border-gray-300"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Este valor será aplicado automaticamente a novos eventos
              </p>
              
              {/* Sync button for active events */}
              {activeEvents.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 mb-2">
                    {eventsWithDifferentIncrement.length > 0 ? (
                      <>
                        <strong>{eventsWithDifferentIncrement.length}</strong> evento(s) ativo(s) usam incremento diferente do padrão
                      </>
                    ) : (
                      <>Todos os {activeEvents.length} evento(s) ativo(s) usam o incremento padrão</>
                    )}
                  </p>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                        disabled={activeEvents.length === 0}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aplicar a Eventos Ativos ({activeEvents.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Atualizar Eventos Ativos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá atualizar o incremento mínimo de <strong>{activeEvents.length}</strong> evento(s) 
                          ativos/agendados para <strong>R$ {formData.default_increment.toFixed(2)}</strong>.
                          <br /><br />
                          Os botões de incremento rápido na loja serão ajustados automaticamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateAllEvents.mutate(formData.default_increment)}
                          disabled={updateAllEvents.isPending}
                        >
                          {updateAllEvents.isPending ? 'Atualizando...' : 'Confirmar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Labels */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Type className="w-5 h-5" />
              Textos Customizáveis
            </CardTitle>
            <CardDescription>Personalize os textos exibidos na loja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900">Título do Evento</Label>
              <Input
                value={formData.event_title_label}
                onChange={(e) => setFormData(prev => ({ ...prev, event_title_label: e.target.value }))}
                placeholder="Oferta Interativa"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900">Texto do Botão</Label>
              <Input
                value={formData.participate_button_text}
                onChange={(e) => setFormData(prev => ({ ...prev, participate_button_text: e.target.value }))}
                placeholder="Participar"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900">Label Valor Atual</Label>
              <Input
                value={formData.current_value_label}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value_label: e.target.value }))}
                placeholder="Valor Atual"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900">Label Tempo Restante</Label>
              <Input
                value={formData.time_remaining_label}
                onChange={(e) => setFormData(prev => ({ ...prev, time_remaining_label: e.target.value }))}
                placeholder="Tempo Restante"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Experience Settings */}
        <Card className="bg-white border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Sparkles className="w-5 h-5" />
              Experiência do Usuário
            </CardTitle>
            <CardDescription>Configurações de som e animações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label className="text-gray-900 font-medium">Sons</Label>
                    <p className="text-sm text-gray-500">Tocar sons em novas ofertas</p>
                  </div>
                </div>
                <Switch
                  checked={formData.enable_sounds}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_sounds: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                  <div>
                    <Label className="text-gray-900 font-medium">Animações</Label>
                    <p className="text-sm text-gray-500">Animações ao atualizar valores</p>
                  </div>
                </div>
                <Switch
                  checked={formData.enable_animations}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_animations: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
