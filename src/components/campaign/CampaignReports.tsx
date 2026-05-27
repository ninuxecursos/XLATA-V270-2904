import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3, Download, Edit, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CampaignMaterial {
  id: string;
  name: string;
  price_per_kg: number;
  is_active: boolean;
  created_at: string;
}

interface CampaignStats {
  totalClients: number;
  totalDeliveries: number;
  totalValue: number;
  totalWeight: number;
  activeClients: number;
}

export function CampaignReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<CampaignMaterial[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<CampaignMaterial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price_per_kg: ""
  });

  const loadMaterials = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      // Carregar estatísticas básicas
      const [clientsResult, deliveriesResult] = await Promise.all([
        supabase
          .from('campaign_clients')
          .select('id, is_active')
          .eq('user_id', user.id),
        supabase
          .from('campaign_deliveries')
          .select('weight_kg, total_value')
          .eq('user_id', user.id)
      ]);

      const clients = clientsResult.data || [];
      const deliveries = deliveriesResult.data || [];

      const statsData: CampaignStats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.is_active).length,
        totalDeliveries: deliveries.length,
        totalValue: deliveries.reduce((sum, d) => sum + d.total_value, 0),
        totalWeight: deliveries.reduce((sum, d) => sum + d.weight_kg, 0)
      };

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadMaterials(), loadStats()]);
  }, [user?.id]);

  const resetForm = () => {
    setFormData({ name: "", price_per_kg: "" });
    setEditingMaterial(null);
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const price = parseFloat(formData.price_per_kg);
      if (price <= 0) {
        toast({
          title: "Erro",
          description: "Preço deve ser maior que zero",
          variant: "destructive"
        });
        return;
      }

      if (editingMaterial) {
        const { error } = await supabase
          .from('campaign_materials')
          .update({
            name: formData.name,
            price_per_kg: price
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Material atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('campaign_materials')
          .insert({
            user_id: user.id,
            name: formData.name,
            price_per_kg: price
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Material cadastrado com sucesso"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadMaterials();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar material",
        variant: "destructive"
      });
    }
  };

  const handleEditMaterial = (material: CampaignMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      price_per_kg: material.price_per_kg.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;

    try {
      const { error } = await supabase
        .from('campaign_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Material excluído com sucesso"
      });
      
      loadMaterials();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir material",
        variant: "destructive"
      });
    }
  };

  const toggleMaterialStatus = async (materialId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('campaign_materials')
        .update({ is_active: !isActive })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Material ${!isActive ? 'ativado' : 'desativado'} com sucesso`
      });
      
      loadMaterials();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do material",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Materiais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total de Clientes</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalClients}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.activeClients} ativos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total de Entregas</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalDeliveries}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Peso Total (kg)</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalWeight.toFixed(1)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-3xl font-bold text-orange-600">R$ {stats.totalValue.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Relatório de Clientes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Relatório de Entregas
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Relatório Financeiro
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Relatório Mensal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Materiais
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMaterial ? "Editar Material" : "Novo Material"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitMaterial} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Material *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: PET, Alumínio, Papelão..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="price">Preço por kg (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.price_per_kg}
                        onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                        placeholder="Ex: 2.50"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        {editingMaterial ? "Atualizar" : "Cadastrar"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum material cadastrado ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map((material) => (
                    <Card key={material.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium">{material.name}</h3>
                          <Badge variant={material.is_active ? "default" : "secondary"}>
                            {material.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <p className="text-2xl font-bold text-green-600 mb-4">
                          R$ {material.price_per_kg.toFixed(2)}/kg
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMaterial(material)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant={material.is_active ? "secondary" : "default"}
                            onClick={() => toggleMaterialStatus(material.id, material.is_active)}
                          >
                            {material.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}