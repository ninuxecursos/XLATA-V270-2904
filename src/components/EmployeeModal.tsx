import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserCog, Mail, Phone, DollarSign, Clock, Percent, StickyNote } from 'lucide-react';
import { DepotEmployee, EmployeeFormData, CreateEmployeeResult } from '@/hooks/useDepotEmployees';
import { EmployeePasswordModal } from '@/components/EmployeePasswordModal';
import { Textarea } from '@/components/ui/textarea';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => Promise<CreateEmployeeResult>;
  onUpdate?: (id: string, data: Partial<EmployeeFormData>) => Promise<boolean>;
  employee?: DepotEmployee | null;
}

const WEEK_DAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export function EmployeeModal({ isOpen, onClose, onSave, onUpdate, employee }: EmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'operador',
    salary: null,
    work_start_time: '08:00',
    work_end_time: '18:00',
    work_days: [1, 2, 3, 4, 5],
    discount_percentage: null,
    notes: null,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        salary: employee.salary,
        work_start_time: employee.work_start_time || '08:00',
        work_end_time: employee.work_end_time || '18:00',
        work_days: employee.work_days || [1, 2, 3, 4, 5],
        discount_percentage: employee.discount_percentage,
        notes: employee.notes,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'operador',
        salary: null,
        work_start_time: '08:00',
        work_end_time: '18:00',
        work_days: [1, 2, 3, 4, 5],
        discount_percentage: null,
        notes: null,
      });
    }
  }, [employee, isOpen]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleToggleDay = (day: number) => {
    const current = formData.work_days || [];
    if (current.includes(day)) {
      setFormData({ ...formData, work_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, work_days: [...current, day] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setLoading(true);
    try {
      if (employee && onUpdate) {
        await onUpdate(employee.id, formData);
        onClose();
      } else {
        const result = await onSave(formData);
        if (result.employee && result.generatedPassword) {
          setCreatedEmployee({
            name: result.employee.name,
            email: result.employee.email,
            password: result.generatedPassword,
          });
          setShowPasswordModal(true);
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setCreatedEmployee(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showPasswordModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dados Básicos */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <UserCog className="h-4 w-4" /> Nome Completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do funcionário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                  disabled={!!employee}
                />
                {!employee && (
                  <p className="text-xs text-muted-foreground">
                    Este email será usado para o login. Uma senha será gerada automaticamente.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Salário e Desconto */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Financeiro
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salário (R$)</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary ?? ''}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount" className="flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Desconto Máx. (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount_percentage ?? ''}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Horário de Trabalho */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                <Clock className="h-4 w-4" /> Horário de Trabalho
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-2">
                  <Label htmlFor="work_start">Entrada</Label>
                  <Input
                    id="work_start"
                    type="time"
                    value={formData.work_start_time || '08:00'}
                    onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_end">Saída</Label>
                  <Input
                    id="work_end"
                    type="time"
                    value={formData.work_end_time || '18:00'}
                    onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dias de Trabalho</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                        (formData.work_days || []).includes(day.value)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-background border-input hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={(formData.work_days || []).includes(day.value)}
                        onCheckedChange={() => handleToggleDay(day.value)}
                        className="hidden"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1">
                  <StickyNote className="h-4 w-4" /> Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                  placeholder="Observações sobre o funcionário..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.name.trim() || !formData.email.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {employee ? 'Salvando...' : 'Cadastrando...'}
                  </>
                ) : (
                  employee ? 'Salvar Alterações' : 'Cadastrar Funcionário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {createdEmployee && (
        <EmployeePasswordModal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          email={createdEmployee.email}
          password={createdEmployee.password}
          employeeName={createdEmployee.name}
        />
      )}
    </>
  );
}
