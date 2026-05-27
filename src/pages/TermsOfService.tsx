
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Scale, Shield, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center mb-8">
            <img
              src="/lovable-uploads/xlata.site_logotipo.png"
              alt="XLATA.SITE"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso e Política de Privacidade</h1>
            <p className="text-gray-400">SISTEMA XLATA.SITE</p>
            <p className="text-gray-500 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Termos de Uso */}
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-green-400" />
                Termos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Aceitação dos Termos</h3>
                <p>
                  Ao acessar e usar o <strong>SISTEMA XLATA.SITE</strong>, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Descrição do Serviço</h3>
                <p>
                  O XLATA.SITE é um sistema de Ponto de Venda (PDV) que oferece soluções completas para gestão comercial, 
                  incluindo controle de estoque, vendas, relatórios financeiros e outras funcionalidades relacionadas.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Conta de Usuário</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Você é responsável por manter a confidencialidade de sua conta e senha</li>
                  <li>Você concorda em aceitar a responsabilidade por todas as atividades que ocorrem em sua conta</li>
                  <li>Você deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                  <li>Reservamo-nos o direito de encerrar contas que violem estes termos</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Uso Permitido</h3>
                <p>Você concorda em usar o serviço apenas para:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Finalidades comerciais legítimas</li>
                  <li>Gestão de seu próprio negócio</li>
                  <li>Atividades que não violem leis locais, estaduais ou federais</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Uso Proibido</h3>
                <p>Você não pode usar o serviço para:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Atividades ilegais ou fraudulentas</li>
                  <li>Violar direitos de propriedade intelectual</li>
                  <li>Transmitir vírus ou códigos maliciosos</li>
                  <li>Interferir no funcionamento do sistema</li>
                  <li>Revender ou redistribuir o serviço sem autorização</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6. Pagamentos e Reembolsos</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Os pagamentos são processados através de plataformas seguras</li>
                  <li>Oferecemos período de teste gratuito de 7 dias</li>
                  <li>Reembolsos serão processados conforme nossa política específica</li>
                  <li>Taxas de assinatura são cobradas antecipadamente</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7. Limitação de Responsabilidade</h3>
                <p>
                  O XLATA.SITE não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequenciais 
                  resultantes do uso ou incapacidade de usar nossos serviços.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Política de Privacidade */}
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Política de Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Coleta de Informações</h3>
                <p>Coletamos os seguintes tipos de informações:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Informações pessoais:</strong> Nome, e-mail, telefone</li>
                  <li><strong>Informações de uso:</strong> Dados sobre como você usa nosso serviço</li>
                  <li><strong>Informações técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados comerciais:</strong> Informações sobre vendas, produtos e clientes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Uso das Informações</h3>
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Processar transações e pagamentos</li>
                  <li>Comunicar-se sobre atualizações e suporte</li>
                  <li>Personalizar sua experiência</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Compartilhamento de Informações</h3>
                <p>
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Com seu consentimento explícito</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Com provedores de serviços terceirizados (sob acordo de confidencialidade)</li>
                  <li>Para proteger nossos direitos legais</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Segurança dos Dados</h3>
                <p>
                  Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações 
                  contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Retenção de Dados</h3>
                <p>
                  Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e cumprir obrigações legais. 
                  Dados podem ser mantidos por até 5 anos após o encerramento da conta.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6. Seus Direitos</h3>
                <p>Você tem direito a:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir informações incorretas</li>
                  <li>Solicitar exclusão de seus dados</li>
                  <li>Portabilidade de dados</li>
                  <li>Retirar consentimento a qualquer momento</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-400" />
                Política de Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. O que são Cookies</h3>
                <p>
                  Cookies são pequenos arquivos de texto que são armazenados em seu dispositivo quando você visita nosso site. 
                  Eles nos ajudam a melhorar sua experiência de usuário.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Tipos de Cookies que Utilizamos</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento do site</li>
                  <li><strong>Cookies de desempenho:</strong> Coletam informações sobre como você usa o site</li>
                  <li><strong>Cookies de funcionalidade:</strong> Permitem que o site lembre suas preferências</li>
                  <li><strong>Cookies de marketing:</strong> Usados para personalizar anúncios (com seu consentimento)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Gerenciamento de Cookies</h3>
                <p>
                  Você pode controlar e/ou excluir cookies conforme desejar. Pode excluir todos os cookies que já estão 
                  em seu computador e configurar a maioria dos navegadores para impedir que sejam colocados.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-400" />
                Contato e Alterações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Contato</h3>
                <p>
                  Para questões sobre estes termos ou nossa política de privacidade, 
                  entre em contato conosco através do suporte do XLATA.SITE.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Alterações</h3>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                  Alterações significativas serão comunicadas através de nosso site ou por e-mail.
                </p>
              </div>

              <Separator className="bg-gray-600 my-4" />
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} XLATA.SITE - Todos os direitos reservados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
