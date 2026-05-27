import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { UserCog, Search, Loader2, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeAdmin {
  id: string;
  owner_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
  permissions_count?: number;
}

export function EmployeesManagement() {
  const [employees, setEmployees] = useState<EmployeeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('depot_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (employeesError) throw employeesError;

      // Fetch owner profiles
      const ownerIds = [...new Set(employeesData?.map(e => e.owner_user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, company')
        .in('id', ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch permissions count for each employee
      const employeeIds = employeesData?.map(e => e.id) || [];
      const { data: permissions } = await supabase
        .from('employee_permissions')
        .select('employee_id')
        .in('employee_id', employeeIds);

      const permissionsCount = new Map<string, number>();
      permissions?.forEach(p => {
        permissionsCount.set(p.employee_id, (permissionsCount.get(p.employee_id) || 0) + 1);
      });

      const enrichedEmployees = employeesData?.map(employee => ({
        ...employee,
        owner_email: profileMap.get(employee.owner_user_id)?.email,
        owner_name: profileMap.get(employee.owner_user_id)?.company,
        permissions_count: permissionsCount.get(employee.id) || 0,
      })) || [];

      setEmployees(enrichedEmployees);
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      (employee.owner_email && employee.owner_email.toLowerCase().includes(query)) ||
      (employee.owner_name && employee.owner_name.toLowerCase().includes(query))
    );
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'operador': 'Operador',
      'caixa': 'Caixa',
      'supervisor': 'Supervisor',
      'gerente': 'Gerente',
    };
    return labels[role] || role;
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.is_active).length;
  const uniqueOwners = new Set(employees.map(e => e.owner_user_id)).size;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Depósitos com Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{uniqueOwners}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Funcionários de Todos os Depósitos
          </CardTitle>
          <CardDescription>
            Visualize todos os funcionários cadastrados pelos usuários do sistema
          </CardDescription>
          <div className="relative max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou depósito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Depósito (Dono)</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">Permissões</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </span>
                          {employee.phone && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{employee.owner_name || 'Sem nome'}</div>
                          <div className="text-xs text-muted-foreground">{employee.owner_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleLabel(employee.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{employee.permissions_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {employee.last_login_at 
                          ? format(new Date(employee.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : 'Nunca acessou'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
