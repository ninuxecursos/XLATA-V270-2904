
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock } from 'lucide-react';
import { usePasswordAuth } from '@/hooks/usePasswordAuth';

const formSchema = z.object({
  password: z.string().min(1, "Senha é obrigatória")
});

interface PasswordPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
  title?: string;
  description?: string;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ 
  open, 
  onOpenChange,
  onAuthenticated,
  title = "Autenticação Necessária",
  description = "Digite sua senha para continuar"
}) => {
  const { authenticateUser, isAuthenticating } = usePasswordAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: ""
    }
  });

  useEffect(() => {
    if (open) {
      form.reset();
      setErrorMessage(null);
    }
  }, [open, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    const isAuthenticated = await authenticateUser(data.password);
    
    if (isAuthenticated) {
      onAuthenticated();
      onOpenChange(false);
    } else {
      setErrorMessage("Senha incorreta. Tente novamente.");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl" style={{ color: '#10B981' }}>
            <Lock className="h-7 w-7" /> {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Digite sua senha" 
                      className={`bg-gray-800 border-gray-700 text-white ${errorMessage ? 'border-red-500' : ''}`}
                      {...field}
                      autoFocus
                      onChange={(e) => {
                        field.onChange(e);
                        setErrorMessage(null);
                      }}
                    />
                  </FormControl>
                  {errorMessage && (
                    <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
                  )}
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancel}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600"
                disabled={isAuthenticating}
              >
                Voltar
              </Button>
              <Button 
                type="submit" 
                className="bg-pdv-green hover:bg-green-700"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Verificando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordPromptModal;
