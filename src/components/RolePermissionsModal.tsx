import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AVAILABLE_PERMISSIONS } from '@/hooks/useDepotEmployees';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Package, Archive, DollarSign, Calculator, FileText, Users, Settings } from 'lucide-react';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  { key: 'operador', label: 'Operador' },
  { key: 'caixa', label: 'Caixa' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'gerente', label: 'Gerente' },
];

const categoryIcons: Record<string, React.ElementType> = {
  'PDV': ShoppingCart,
  'Materiais': Package,
  'Estoque': Archive,
  'Financeiro': DollarSign,
  'Caixa': Calculator,
  'Relatórios': FileText,
  'Clientes': Users,
  'Configurações': Settings,
};

export function RolePermissionsModal({ isOpen, onClose }: RolePermissionsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState('operador');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    operador: [],
    caixa: [],
    supervisor: [],
    gerente: [],
  });

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchAllRolePermissions();
    }
  }, [isOpen, user?.id]);

  const fetchAllRolePermissions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_default_permissions')
        .select('role, permission')
        .eq('user_id', user.id);

      if (error) throw error;

      const permissions: Record<string, string[]> = {
        operador: [],
        caixa: [],
        supervisor: [],
        gerente: [],
      };

      data?.forEach(item => {
        if (permissions[item.role]) {
          permissions[item.role].push(item.permission);
        }
      });

      setRolePermissions(permissions);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setRolePermissions(prev => {
      const current = prev[activeRole] || [];
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission];
      return { ...prev, [activeRole]: updated };
    });
  };

  const selectAll = () => {
    setRolePermissions(prev => ({
      ...prev,
      [activeRole]: AVAILABLE_PERMISSIONS.map(p => p.key),
    }));
  };

  const deselectAll = () => {
    setRolePermissions(prev => ({
      ...prev,
      [activeRole]: [],
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      // Delete all existing permissions for this user
      await supabase
        .from('role_default_permissions')
        .delete()
        .eq('user_id', user.id);

      // Insert all role permissions
      const insertData: { user_id: string; role: string; permission: string }[] = [];
      
      Object.entries(rolePermissions).forEach(([role, permissions]) => {
        permissions.forEach(permission => {
          insertData.push({
            user_id: user.id,
            role,
            permission,
          });
        });
      });

      if (insertData.length > 0) {
        const { error } = await supabase
          .from('role_default_permissions')
          .insert(insertData);

        if (error) throw error;
      }

      toast.success('Permissões salvas com sucesso!');
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar permissões:', err);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  const currentPermissions = rolePermissions[activeRole] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Permissões por Cargo</DialogTitle>
          <DialogDescription>
            Configure as permissões padrão para cada cargo. Ao criar um funcionário, ele receberá automaticamente as permissões do cargo selecionado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <Tabs value={activeRole} onValueChange={setActiveRole} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-4 mb-4">
                {ROLES.map(role => (
                  <TabsTrigger 
                    key={role.key} 
                    value={role.key}
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex justify-end gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Desmarcar Todos
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {ROLES.map(role => (
                  <TabsContent key={role.key} value={role.key} className="mt-0 space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                      const IconComponent = categoryIcons[category] || Settings;
                      return (
                        <div key={category} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="h-4 w-4 text-emerald-600" />
                            <h4 className="font-medium text-sm">{category}</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2 pl-6">
                            {permissions.map(perm => (
                              <label
                                key={perm.key}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={currentPermissions.includes(perm.key)}
                                  onCheckedChange={() => togglePermission(perm.key)}
                                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Permissões'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
