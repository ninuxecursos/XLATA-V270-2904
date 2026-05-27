import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronsUpDown, Eye, X, Loader2, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface AdminUserViewSelectorProps {
  currentViewingUser?: string;
  currentViewingUserName?: string;
}

export function AdminUserViewSelector({ 
  currentViewingUser, 
  currentViewingUserName 
}: AdminUserViewSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load users when popover opens
  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string, userName: string | null, userEmail: string) => {
    setOpen(false);
    navigate('/dashboard', {
      replace: true,
      state: {
        adminViewingUser: userId,
        adminViewingUserName: userName || userEmail
      }
    });
  };

  const handleExitAdminView = () => {
    setOpen(false);
    navigate('/dashboard', {
      replace: true,
      state: {}
    });
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const isViewingUser = !!currentViewingUser;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between min-w-[200px] max-w-[300px] border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200",
              isViewingUser && "border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/30"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Eye className={cn("h-4 w-4 shrink-0", isViewingUser ? "text-purple-400" : "text-slate-400")} />
              <span className="truncate">
                {isViewingUser 
                  ? `Ver como: ${currentViewingUserName}` 
                  : "Ver como..."
                }
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-slate-800 border-slate-700" align="start">
          <Command className="bg-transparent">
            <div className="flex items-center border-b border-slate-700 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
              <input
                placeholder="Buscar usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-400">Carregando...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <CommandGroup className="p-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user.id, user.name, user.email)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-slate-700 transition-colors",
                        currentViewingUser === user.id && "bg-purple-900/30"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                          <User className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-200 truncate">
                            {user.name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-slate-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      {currentViewingUser === user.id && (
                        <Check className="h-4 w-4 text-purple-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isViewingUser && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExitAdminView}
          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 px-2"
          title="Sair do modo de visualização"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
