import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Monitor, Users, Loader2, AlertTriangle, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdvSession {
  id: string;
  owner_user_id: string;
  employee_user_id: string;
  session_token: string;
  device_info: string | null;
  is_active: boolean;
  started_at: string;
  last_heartbeat: string;
}

interface PdvAccessConfig {
  max_concurrent_slots: number;
  extra_slots_purchased: number;
}

interface PdvSlotsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PdvSlotsManagementModal({ isOpen, onClose }: PdvSlotsManagementModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PdvSession[]>([]);
  const [config, setConfig] = useState<PdvAccessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch active sessions
      const { data: sessionsData } = await supabase
        .from('pdv_sessions')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      const activeSessions = (sessionsData as PdvSession[]) || [];
      setSessions(activeSessions);

      // Fetch config
      const { data: configData } = await supabase
        .from('pdv_access_config')
        .select('max_concurrent_slots, extra_slots_purchased')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      setConfig(configData as PdvAccessConfig || { max_concurrent_slots: 3, extra_slots_purchased: 0 });

      // Fetch employee names for active sessions
      if (activeSessions.length > 0) {
        const employeeIds = [...new Set(activeSessions.map(s => s.employee_user_id))];
        const { data: employees } = await supabase
          .from('depot_employees')
          .select('employee_user_id, name')
          .eq('owner_user_id', user.id)
          .in('employee_user_id', employeeIds);

        const names: Record<string, string> = {};
        (employees || []).forEach((emp: any) => {
          if (emp.employee_user_id) names[emp.employee_user_id] = emp.name;
        });
        // The owner might also be in the sessions
        names[user.id] = 'Você (Proprietário)';
        setEmployeeNames(names);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de slots:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const handleForceDisconnect = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('pdv_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Sessão desconectada com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao desconectar sessão: ' + err.message);
    }
  };

  const maxSlots = config ? config.max_concurrent_slots + config.extra_slots_purchased : 3;
  const usedSlots = sessions.length;
  const remainingSlots = Math.max(maxSlots - usedSlots, 0);

  const isSessionStale = (lastHeartbeat: string) => {
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    return diff > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Gestão de Acessos ao PDV
          </DialogTitle>
          <DialogDescription>
            Controle os acessos simultâneos ao PDV da sua empresa
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slots Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{maxSlots}</p>
                  <p className="text-xs text-muted-foreground">Máximo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{usedSlots}</p>
                  <p className="text-xs text-muted-foreground">Em Uso</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{remainingSlots}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </CardContent>
              </Card>
            </div>

            {/* Extra slots info */}
            {config && config.extra_slots_purchased > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Slots extras comprados: {config.extra_slots_purchased}
              </div>
            )}

            {/* Warning if near limit */}
            {remainingSlots === 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Limite atingido!</p>
                  <p>Para liberar mais acessos simultâneos, desconecte uma sessão ativa ou adquira slots adicionais (R$ 50,00 cada).</p>
                </div>
              </div>
            )}

            {/* Active Sessions */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Sessões Ativas ({sessions.length})
              </h4>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma sessão ativa no momento.
                </p>
              ) : (
                <ScrollArea className="max-h-[30vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Sinal</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => {
                        const stale = isSessionStale(session.last_heartbeat);
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="text-sm font-medium">
                              {employeeNames[session.employee_user_id] || 'Desconhecido'}
                            </TableCell>
                            <TableCell>
                              {stale ? (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                                  <WifiOff className="h-3 w-3" /> Inativo
                                </Badge>
                              ) : (
                                <Badge className="text-xs flex items-center gap-1 w-fit bg-emerald-600">
                                  <Wifi className="h-3 w-3" /> Online
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(session.last_heartbeat), "HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleForceDisconnect(session.id)}
                                title="Forçar desconexão"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
