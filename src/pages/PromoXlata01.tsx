import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignClientManager } from "@/components/campaign/CampaignClientManager";
import { MaterialDeliveryForm } from "@/components/campaign/MaterialDeliveryForm";
import { PeriodClosing } from "@/components/campaign/PeriodClosing";
import { CampaignReports } from "@/components/campaign/CampaignReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Calendar, BarChart3 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

export default function PromoXlata01() {

  const [activeTab, setActiveTab] = useState("clients");

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full border border-green-500/20">
            <span className="text-2xl">♻️</span>
            <span className="text-sm font-medium text-foreground">CAMPANHA ATIVA</span>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Sua Reciclagem Paga Sua Conta
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de gestão da campanha de reciclagem sustentável. 
            Cadastre clientes, registre entregas e gere comprovantes de desconto.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Entregas
            </TabsTrigger>
            <TabsTrigger value="closing" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechamento
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Clientes
                </CardTitle>
                <CardDescription>
                  Cadastre e gerencie os clientes participantes da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignClientManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Registro de Entregas
                </CardTitle>
                <CardDescription>
                  Registre materiais entregues pelos clientes e calcule créditos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialDeliveryForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechamento Mensal
                </CardTitle>
                <CardDescription>
                  Processe o fechamento do período e gere comprovantes de desconto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PeriodClosing />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Relatórios e Configurações
                </CardTitle>
                <CardDescription>
                  Visualize relatórios da campanha e configure preços dos materiais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignReports />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}