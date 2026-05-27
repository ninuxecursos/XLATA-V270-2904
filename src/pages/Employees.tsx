import { useState, useMemo } from 'react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { FEATURE_KEYS } from '@/constants/featureAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  UserCog, Plus, Search, MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight,
  Shield, Phone, Mail, Loader2, Settings, History, BarChart3, Clock, Monitor, Users
} from 'lucide-react';
import { useDepotEmployees, DepotEmployee } from '@/hooks/useDepotEmployees';
import { EmployeeInlineForm } from '@/components/EmployeeInlineForm';
import { EmployeeSlotPaymentFlow } from '@/components/EmployeeSlotPaymentFlow';
import { EmployeePermissionsModal } from '@/components/EmployeePermissionsModal';
import { EmployeeActionLogsModal } from '@/components/EmployeeActionLogsModal';
import { EmployeeReportModal } from '@/components/EmployeeReportModal';
import { RolePermissionsModal } from '@/components/RolePermissionsModal';
import { PdvSlotsManagementModal } from '@/components/PdvSlotsManagementModal';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Employees() {
  const { 
    employees, loading, createEmployee, updateEmployee, deleteEmployee, 
    toggleEmployeeStatus, getEmployeePermissions, updateEmployeePermissions 
  } = useDepotEmployees();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DepotEmployee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<DepotEmployee | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [isRolePermissionsModalOpen, setIsRolePermissionsModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsEmployeeId, setLogsEmployeeId] = useState<string | null>(null);
  const [logsEmployeeName, setLogsEmployeeName] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportEmployee, setReportEmployee] = useState<DepotEmployee | null>(null);
  const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (showActiveOnly) result = result.filter(e => e.is_active);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        (e.phone && e.phone.includes(searchQuery))
      );
    }
    return result;
  }, [employees, searchQuery, showActiveOnly]);

  const handleEdit = (employee: DepotEmployee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleManagePermissions = async (employee: DepotEmployee) => {
    setSelectedEmployee(employee);
    const perms = await getEmployeePermissions(employee.id);
    setCurrentPermissions(perms.map(p => p.permission));
    setIsPermissionsModalOpen(true);
  };

  const handleSavePermissions = async (permissions: string[]): Promise<boolean> => {
    if (!selectedEmployee) return false;
    return updateEmployeePermissions(selectedEmployee.id, permissions);
  };

  const handleViewLogs = (employee: DepotEmployee) => {
    setLogsEmployeeId(employee.employee_user_id);
    setLogsEmployeeName(employee.name);
    setIsLogsModalOpen(true);
  };

  const handleViewAllLogs = () => {
    setLogsEmployeeId(null);
    setLogsEmployeeName('');
    setIsLogsModalOpen(true);
  };

  const handleViewReport = (employee: DepotEmployee) => {
    setReportEmployee(employee);
    setIsReportModalOpen(true);
  };

  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setShowPaymentFlow(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedEmployee(null);
    setCurrentPermissions([]);
  };

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'gerente': return 'default';
      case 'supervisor': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'operador': 'Operador', 'caixa': 'Caixa', 'supervisor': 'Supervisor', 'gerente': 'Gerente',
    };
    return labels[role] || role;
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (showPaymentFlow) {
    return (
      <EmployeeSlotPaymentFlow
        onBack={() => setShowPaymentFlow(false)}
        onComplete={() => setShowPaymentFlow(false)}
      />
    );
  }

  if (isModalOpen) {
    return (
      <div className="flex-1 w-full p-4 md:p-6">
        <EmployeeInlineForm
          onBack={handleCloseModal}
          onSave={createEmployee}
          onUpdate={updateEmployee}
          employee={selectedEmployee}
        />
      </div>
    );
  }

  return (
    <FeatureGuard feature={FEATURE_KEYS.EMPLOYEE_MANAGEMENT}>
    <>
      <div className="flex-1 w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Funcionários
            </h1>
            <p className="text-muted-foreground">
              Gerencie funcionários, salários, horários e permissões
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setIsSlotsModalOpen(true)}>
              <Monitor className="h-4 w-4 mr-2" />
              Slots PDV
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewAllLogs}>
              <History className="h-4 w-4 mr-2" />
              Auditoria
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsRolePermissionsModalOpen(true)}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Permissões
            </Button>
            <Button onClick={handleNewEmployee} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">
              <Users className="h-4 w-4 mr-1" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou telefone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showActiveOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowActiveOnly(!showActiveOnly)}
                      className={showActiveOnly ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                    >
                      {showActiveOnly ? 'Apenas Ativos' : 'Todos'}
                    </Button>
                    <Badge variant="secondary">
                      {filteredEmployees.length} funcionário(s)
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Nenhum funcionário encontrado.' : 'Nenhum funcionário cadastrado ainda.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Salário</TableHead>
                          <TableHead>Expediente</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="w-10"></TableHead>
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
                              <Badge variant={getRoleBadgeVariant(employee.role)}>
                                {getRoleLabel(employee.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatCurrency(employee.salary)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {employee.work_start_time && employee.work_end_time ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {employee.work_start_time} - {employee.work_end_time}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                                {employee.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleManagePermissions(employee)}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Permissões
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewReport(employee)}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Relatório
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewLogs(employee)}>
                                    <History className="h-4 w-4 mr-2" />
                                    Histórico
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => toggleEmployeeStatus(employee.id, !employee.is_active)}
                                  >
                                    {employee.is_active ? (
                                      <>
                                        <ToggleLeft className="h-4 w-4 mr-2" />
                                        Desativar
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="h-4 w-4 mr-2" />
                                        Ativar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setEmployeeToDelete(employee)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <EmployeeDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <EmployeePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={handleClosePermissionsModal}
        employee={selectedEmployee}
        currentPermissions={currentPermissions}
        onSave={handleSavePermissions}
      />

      <RolePermissionsModal
        isOpen={isRolePermissionsModalOpen}
        onClose={() => setIsRolePermissionsModalOpen(false)}
      />

      <EmployeeActionLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        employeeId={logsEmployeeId}
        employeeName={logsEmployeeName}
      />

      <EmployeeReportModal
        isOpen={isReportModalOpen}
        onClose={() => { setIsReportModalOpen(false); setReportEmployee(null); }}
        employee={reportEmployee}
      />

      <PdvSlotsManagementModal
        isOpen={isSlotsModalOpen}
        onClose={() => setIsSlotsModalOpen(false)}
      />

      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funcionário "{employeeToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
    </FeatureGuard>
  );
}
