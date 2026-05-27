import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Package, Save, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { safeLogger } from "@/utils/safeLogger";

interface CampaignClient {
  id: string;
  name: string;
  cpf: string;
}

interface CampaignMaterial {
  id: string;
  name: string;
  price_per_kg: number;
}

const deliveryFormSchema = z.object({
  client_id: z.string().min(1, "Selecione um cliente"),
  material_id: z.string().min(1, "Selecione um material"),
  weight_kg: z.string()
    .min(1, "Peso é obrigatório")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Peso deve ser maior que zero"
    }),
  delivery_date: z.date({
    required_error: "Data de entrega é obrigatória"
  })
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

export function MaterialDeliveryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<CampaignClient[]>([]);
  const [materials, setMaterials] = useState<CampaignMaterial[]>([]);
  const [calculatedValue, setCalculatedValue] = useState<number>(0);
  
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      client_id: "",
      material_id: "",
      weight_kg: "",
      delivery_date: new Date()
    }
  });

  const loadClients = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_clients')
        .select('id, name, cpf')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      safeLogger.error('Erro ao carregar clientes:', error);
    }
  };

  const loadMaterials = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_materials')
        .select('id, name, price_per_kg')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      safeLogger.error('Erro ao carregar materiais:', error);
    }
  };

  useEffect(() => {
    loadClients();
    loadMaterials();
  }, [user?.id]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const weight = parseFloat(value.weight_kg || "0");
      const selectedMaterial = materials.find(m => m.id === value.material_id);
      
      if (weight > 0 && selectedMaterial) {
        const total = weight * selectedMaterial.price_per_kg;
        setCalculatedValue(total);
      } else {
        setCalculatedValue(0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, materials]);

  const handleSubmit = async (values: DeliveryFormData) => {
    if (!user?.id) return;

    if (calculatedValue <= 0) {
      toast({
        title: "Erro",
        description: "Verifique os dados informados",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedMaterial = materials.find(m => m.id === values.material_id);
      if (!selectedMaterial) throw new Error("Material não encontrado");

      const weight = parseFloat(values.weight_kg);
      
      const { error } = await supabase
        .from('campaign_deliveries')
        .insert({
          user_id: user.id,
          client_id: values.client_id,
          material_id: values.material_id,
          weight_kg: weight,
          price_per_kg: selectedMaterial.price_per_kg,
          total_value: calculatedValue,
          delivery_date: format(values.delivery_date, 'yyyy-MM-dd')
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Entrega registrada: R$ ${calculatedValue.toFixed(2)}`
      });

      form.reset();
      setCalculatedValue(0);
    } catch (error) {
      safeLogger.error('Erro ao registrar entrega:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega",
        variant: "destructive"
      });
    }
  };

  const selectedMaterial = materials.find(m => m.id === form.watch("material_id"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Registrar Nova Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.cpf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} - R$ {material.price_per_kg.toFixed(2)}/kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Ex: 15.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Entrega *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            {selectedMaterial && form.watch("weight_kg") && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700">Cálculo do Valor</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Material: <strong>{selectedMaterial.name}</strong></p>
                    <p>Peso: <strong>{form.watch("weight_kg")} kg</strong></p>
                    <p>Preço por kg: <strong>R$ {selectedMaterial.price_per_kg.toFixed(2)}</strong></p>
                    <hr className="my-2" />
                    <p className="text-lg font-bold text-green-700">
                      Total: R$ {calculatedValue.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting || calculatedValue <= 0} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {form.formState.isSubmitting ? "Registrando..." : "Registrar Entrega"}
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {materials.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-amber-700">
              <strong>Atenção:</strong> Nenhum material cadastrado. 
              Acesse a aba "Relatórios" para configurar os materiais e preços.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}