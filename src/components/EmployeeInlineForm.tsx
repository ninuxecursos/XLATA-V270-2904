import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCog, Mail, Phone, DollarSign, Clock, Percent, StickyNote, ArrowLeft } from 'lucide-react';
import { DepotEmployee, EmployeeFormData, CreateEmployeeResult } from '@/hooks/useDepotEmployees';
import { EmployeePasswordModal } from '@/components/EmployeePasswordModal';

interface EmployeeInlineFormProps {
  onBack: () => void;
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

export function EmployeeInlineForm({ onBack, onSave, onUpdate, employee }: EmployeeInlineFormProps) {
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
      if (employee.salary != null) {
        setSalaryDisplay(employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      if (employee.discount_percentage != null) {
        setDiscountDisplay(employee.discount_percentage.toString().replace('.', ','));
      }
    }
  }, [employee]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const num = parseInt(numbers, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrency = (formatted: string): number | null => {
    if (!formatted) return null;
    const num = parseFloat(formatted.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  const formatPercent = (value: string) => {
    const numbers = value.replace(/[^\d,]/g, '');
    const parts = numbers.split(',');
    if (parts.length > 2) return parts[0] + ',' + parts[1];
    return numbers;
  };

  const parsePercent = (formatted: string): number | null => {
    if (!formatted) return null;
    const num = parseFloat(formatted.replace(',', '.'));
    return isNaN(num) ? null : Math.min(num, 100);
  };

  const [salaryDisplay, setSalaryDisplay] = useState('');
  const [discountDisplay, setDiscountDisplay] = useState('');

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
        const success = await onUpdate(employee.id, formData);
        if (success) onBack();
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
          onBack();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setCreatedEmployee(null);
    onBack();
  };

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                {/* Nome */}
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

                {/* Email */}
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
                      Usado para login. Senha gerada automaticamente.
                    </p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                {/* Cargo */}
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="h-10">
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

              {/* Financeiro */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Financeiro
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salário (R$)</Label>
                    <Input
                      id="salary"
                      inputMode="numeric"
                      value={salaryDisplay}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setSalaryDisplay(formatted);
                        setFormData({ ...formData, salary: parseCurrency(formatted) });
                      }}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Desconto Máx. (%)
                    </Label>
                    <Input
                      id="discount"
                      inputMode="decimal"
                      value={discountDisplay}
                      onChange={(e) => {
                        const formatted = formatPercent(e.target.value);
                        setDiscountDisplay(formatted);
                        setFormData({ ...formData, discount_percentage: parsePercent(formatted) });
                      }}
                      placeholder="0"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Horário */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Horário de Trabalho
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start mb-4">
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
                <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
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
          </CardContent>
        </Card>
      </div>

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
