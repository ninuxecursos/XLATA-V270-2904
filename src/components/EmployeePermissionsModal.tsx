import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ShoppingCart, Package, Database, DollarSign, Wallet, BarChart3, Users, Settings } from 'lucide-react';
import { DepotEmployee, AVAILABLE_PERMISSIONS } from '@/hooks/useDepotEmployees';

interface EmployeePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: DepotEmployee | null;
  currentPermissions: string[];
  onSave: (permissions: string[]) => Promise<boolean>;
}

const categoryIcons: Record<string, React.ElementType> = {
  'PDV': ShoppingCart,
  'Materiais': Package,
  'Estoque': Database,
  'Financeiro': DollarSign,
  'Caixa': Wallet,
  'Relatórios': BarChart3,
  'Clientes': Users,
  'Configurações': Settings,
};

export function EmployeePermissionsModal({ 
  isOpen, 
  onClose, 
  employee, 
  currentPermissions,
  onSave 
}: EmployeePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPermissions(currentPermissions);
  }, [currentPermissions, isOpen]);

  const handleTogglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const success = await onSave(selectedPermissions);
      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões - {employee?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
              Selecionar Tudo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
              Limpar Tudo
            </Button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, permissions]) => {
              const Icon = categoryIcons[category] || Shield;
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-medium text-sm">{category}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pl-6">
                    {permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.key}
                          checked={selectedPermissions.includes(perm.key)}
                          onCheckedChange={() => handleTogglePermission(perm.key)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <Label 
                          htmlFor={perm.key} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {perm.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Permissões'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
