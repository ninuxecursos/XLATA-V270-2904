import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShopUserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  verifiedFilter: boolean | null;
  onVerifiedFilterChange: (verified: boolean | null) => void;
}

export function ShopUserFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  verifiedFilter,
  onVerifiedFilterChange
}: ShopUserFiltersProps) {
  const hasActiveFilters = statusFilter.length > 0 || verifiedFilter !== null;

  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const clearFilters = () => {
    onStatusFilterChange([]);
    onVerifiedFilterChange(null);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                  {statusFilter.length + (verifiedFilter !== null ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes('active')}
              onCheckedChange={() => toggleStatus('active')}
            >
              Ativos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes('inactive')}
              onCheckedChange={() => toggleStatus('inactive')}
            >
              Inativos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes('blocked')}
              onCheckedChange={() => toggleStatus('blocked')}
            >
              Bloqueados
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes('banned')}
              onCheckedChange={() => toggleStatus('banned')}
            >
              Banidos
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Verificação</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={verifiedFilter === true}
              onCheckedChange={() => onVerifiedFilterChange(verifiedFilter === true ? null : true)}
            >
              Email Verificado
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={verifiedFilter === false}
              onCheckedChange={() => onVerifiedFilterChange(verifiedFilter === false ? null : false)}
            >
              Email Não Verificado
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
