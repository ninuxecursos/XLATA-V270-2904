import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, User, Plus, X, Check } from 'lucide-react';
import { DepotClient } from '@/hooks/useDepotClients';
import { cn } from '@/lib/utils';

interface DepotClientSelectProps {
  clients: DepotClient[];
  selectedClient: DepotClient | null;
  onSelect: (client: DepotClient | null) => void;
  onAddNew: () => void;
  disabled?: boolean;
}

export function DepotClientSelect({ 
  clients, 
  selectedClient, 
  onSelect, 
  onAddNew,
  disabled 
}: DepotClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients.filter(c => c.is_active);
    
    const query = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.is_active && (
        c.name.toLowerCase().includes(query) ||
        c.whatsapp.includes(searchQuery) ||
        (c.cpf && c.cpf.includes(searchQuery))
      )
    );
  }, [clients, searchQuery]);

  const handleSelect = (client: DepotClient) => {
    onSelect(client);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        <User className="h-4 w-4" />
        Cliente (opcional)
      </Label>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-start"
              disabled={disabled}
            >
              {selectedClient ? (
                <span className="truncate">{selectedClient.name}</span>
              ) : (
                <span className="text-muted-foreground">Selecionar cliente...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <ScrollArea className="max-h-60">
              {filteredClients.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </div>
              ) : (
                <div className="p-1">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelect(client)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedClient?.id === client.id && "bg-accent"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{client.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {client.whatsapp}
                          {client.cpf && ` • ${client.cpf}`}
                        </div>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Cliente S/ Cadastro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {selectedClient && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {selectedClient && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
          <div>WhatsApp: {selectedClient.whatsapp}</div>
          {selectedClient.cpf && <div>CPF: {selectedClient.cpf}</div>}
          {(selectedClient.address_neighborhood || selectedClient.address_city) && (
            <div>
              Endereço: {[selectedClient.address_number, selectedClient.address_neighborhood, selectedClient.address_city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
