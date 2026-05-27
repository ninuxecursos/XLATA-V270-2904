import { useState } from 'react';
import { Store, Shield, FileText, Plus, Trash2, ShoppingCart, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InstitutionalPages, AboutPage, PrivacyPage, TermsPage, HowToBuyPage, FAQPage } from '@/hooks/useShopConfig';

interface ShopInstitutionalPagesEditorProps {
  pages: InstitutionalPages;
  onChange: (pages: InstitutionalPages) => void;
}

export function ShopInstitutionalPagesEditor({ pages, onChange }: ShopInstitutionalPagesEditorProps) {
  const [activeTab, setActiveTab] = useState('about');

  // Sobre Nós
  const updateAbout = (updates: Partial<AboutPage>) => {
    onChange({
      ...pages,
      about: { ...pages.about, ...updates } as AboutPage,
    });
  };

  const updateAboutValue = (index: number, field: keyof AboutPage['values'][0], value: string) => {
    const newValues = [...(pages.about?.values || [])];
    newValues[index] = { ...newValues[index], [field]: value };
    updateAbout({ values: newValues });
  };

  const addAboutValue = () => {
    const newValues = [...(pages.about?.values || []), { icon: 'quality', title: '', description: '' }];
    updateAbout({ values: newValues });
  };

  const removeAboutValue = (index: number) => {
    const newValues = (pages.about?.values || []).filter((_, i) => i !== index);
    updateAbout({ values: newValues });
  };

  // Privacidade
  const updatePrivacy = (updates: Partial<PrivacyPage>) => {
    onChange({
      ...pages,
      privacy: { ...pages.privacy, ...updates } as PrivacyPage,
    });
  };

  const updatePrivacySection = (index: number, field: keyof PrivacyPage['sections'][0], value: string) => {
    const newSections = [...(pages.privacy?.sections || [])];
    newSections[index] = { ...newSections[index], [field]: value };
    updatePrivacy({ sections: newSections });
  };

  const addPrivacySection = () => {
    const newSections = [...(pages.privacy?.sections || []), { icon: 'shield', title: '', content: '' }];
    updatePrivacy({ sections: newSections });
  };

  const removePrivacySection = (index: number) => {
    const newSections = (pages.privacy?.sections || []).filter((_, i) => i !== index);
    updatePrivacy({ sections: newSections });
  };

  // Termos
  const updateTerms = (updates: Partial<TermsPage>) => {
    onChange({
      ...pages,
      terms: { ...pages.terms, ...updates } as TermsPage,
    });
  };

  const updateTermsSection = (index: number, field: keyof TermsPage['sections'][0], value: string) => {
    const newSections = [...(pages.terms?.sections || [])];
    newSections[index] = { ...newSections[index], [field]: value };
    updateTerms({ sections: newSections });
  };

  const addTermsSection = () => {
    const newSections = [...(pages.terms?.sections || []), { icon: 'file', title: '', content: '' }];
    updateTerms({ sections: newSections });
  };

  const removeTermsSection = (index: number) => {
    const newSections = (pages.terms?.sections || []).filter((_, i) => i !== index);
    updateTerms({ sections: newSections });
  };

  // Como Comprar
  const updateHowToBuy = (updates: Partial<HowToBuyPage>) => {
    onChange({
      ...pages,
      how_to_buy: { ...pages.how_to_buy, ...updates } as HowToBuyPage,
    });
  };

  const updateHowToBuyStep = (index: number, field: keyof HowToBuyPage['steps'][0], value: string) => {
    const newSteps = [...(pages.how_to_buy?.steps || [])];
    newSteps[index] = { ...newSteps[index], [field]: value };
    updateHowToBuy({ steps: newSteps });
  };

  const addHowToBuyStep = () => {
    const newSteps = [...(pages.how_to_buy?.steps || []), { icon: 'cart', title: '', description: '' }];
    updateHowToBuy({ steps: newSteps });
  };

  const removeHowToBuyStep = (index: number) => {
    const newSteps = (pages.how_to_buy?.steps || []).filter((_, i) => i !== index);
    updateHowToBuy({ steps: newSteps });
  };

  // FAQ
  const updateFaq = (updates: Partial<FAQPage>) => {
    onChange({
      ...pages,
      faq: { ...pages.faq, ...updates } as FAQPage,
    });
  };

  const updateFaqQuestion = (index: number, field: keyof FAQPage['questions'][0], value: string) => {
    const newQuestions = [...(pages.faq?.questions || [])];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    updateFaq({ questions: newQuestions });
  };

  const addFaqQuestion = () => {
    const newQuestions = [...(pages.faq?.questions || []), { question: '', answer: '' }];
    updateFaq({ questions: newQuestions });
  };

  const removeFaqQuestion = (index: number) => {
    const newQuestions = (pages.faq?.questions || []).filter((_, i) => i !== index);
    updateFaq({ questions: newQuestions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">Páginas Institucionais</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-gray-100">
          <TabsTrigger 
            value="about" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 text-[10px] md:text-xs"
          >
            <Store className="w-3 h-3 md:w-3.5 md:h-3.5 md:mr-1 hidden md:block" />
            Sobre
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 text-[10px] md:text-xs"
          >
            <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 md:mr-1 hidden md:block" />
            Privacidade
          </TabsTrigger>
          <TabsTrigger 
            value="terms" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 text-[10px] md:text-xs"
          >
            <FileText className="w-3 h-3 md:w-3.5 md:h-3.5 md:mr-1 hidden md:block" />
            Termos
          </TabsTrigger>
          <TabsTrigger 
            value="howtobuy" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 text-[10px] md:text-xs"
          >
            <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5 md:mr-1 hidden md:block" />
            Comprar
          </TabsTrigger>
          <TabsTrigger 
            value="faq" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 text-[10px] md:text-xs"
          >
            <HelpCircle className="w-3 h-3 md:w-3.5 md:h-3.5 md:mr-1 hidden md:block" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* Tab: Sobre Nós */}
        <TabsContent value="about" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Título</Label>
                <Input
                  value={pages.about?.title || ''}
                  onChange={(e) => updateAbout({ title: e.target.value })}
                  placeholder="Sobre Nós"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Subtítulo</Label>
                <Input
                  value={pages.about?.subtitle || ''}
                  onChange={(e) => updateAbout({ subtitle: e.target.value })}
                  placeholder="Conheça nossa história"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Conteúdo</Label>
              <Textarea
                value={pages.about?.content || ''}
                onChange={(e) => updateAbout({ content: e.target.value })}
                placeholder="Descreva sua empresa, história e missão..."
                rows={6}
                className="bg-white text-gray-900 border-gray-300 resize-none"
              />
            </div>

            {/* Valores */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium text-gray-700">Nossos Valores</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addAboutValue}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {(pages.about?.values || []).map((value, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={value.title}
                        onChange={(e) => updateAboutValue(index, 'title', e.target.value)}
                        placeholder="Título"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                      <Input
                        value={value.description}
                        onChange={(e) => updateAboutValue(index, 'description', e.target.value)}
                        placeholder="Descrição"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAboutValue(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Privacidade */}
        <TabsContent value="privacy" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Título</Label>
                <Input
                  value={pages.privacy?.title || ''}
                  onChange={(e) => updatePrivacy({ title: e.target.value })}
                  placeholder="Política de Privacidade"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Subtítulo</Label>
                <Input
                  value={pages.privacy?.subtitle || ''}
                  onChange={(e) => updatePrivacy({ subtitle: e.target.value })}
                  placeholder="Como protegemos seus dados"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Data da última atualização</Label>
              <Input
                value={pages.privacy?.last_update || ''}
                onChange={(e) => updatePrivacy({ last_update: e.target.value })}
                placeholder="01/01/2024"
                className="h-9 bg-white text-gray-900 border-gray-300 max-w-xs"
              />
            </div>

            {/* Seções */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium text-gray-700">Seções</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPrivacySection}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Seção
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {(pages.privacy?.sections || []).map((section, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`privacy-${index}`}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <span className="text-sm font-medium text-gray-700">
                        {section.title || `Seção ${index + 1}`}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 space-y-3">
                      <Input
                        value={section.title}
                        onChange={(e) => updatePrivacySection(index, 'title', e.target.value)}
                        placeholder="Título da seção"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                      <Textarea
                        value={section.content}
                        onChange={(e) => updatePrivacySection(index, 'content', e.target.value)}
                        placeholder="Conteúdo da seção..."
                        rows={4}
                        className="text-sm bg-white border-gray-300 resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removePrivacySection(index)}
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover Seção
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Termos */}
        <TabsContent value="terms" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Título</Label>
                <Input
                  value={pages.terms?.title || ''}
                  onChange={(e) => updateTerms({ title: e.target.value })}
                  placeholder="Termos de Uso"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Subtítulo</Label>
                <Input
                  value={pages.terms?.subtitle || ''}
                  onChange={(e) => updateTerms({ subtitle: e.target.value })}
                  placeholder="Condições para uso da nossa loja"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Data da última atualização</Label>
              <Input
                value={pages.terms?.last_update || ''}
                onChange={(e) => updateTerms({ last_update: e.target.value })}
                placeholder="01/01/2024"
                className="h-9 bg-white text-gray-900 border-gray-300 max-w-xs"
              />
            </div>

            {/* Seções */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium text-gray-700">Seções</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addTermsSection}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Seção
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {(pages.terms?.sections || []).map((section, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`terms-${index}`}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <span className="text-sm font-medium text-gray-700">
                        {section.title || `Seção ${index + 1}`}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 space-y-3">
                      <Input
                        value={section.title}
                        onChange={(e) => updateTermsSection(index, 'title', e.target.value)}
                        placeholder="Título da seção"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateTermsSection(index, 'content', e.target.value)}
                        placeholder="Conteúdo da seção..."
                        rows={4}
                        className="text-sm bg-white border-gray-300 resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTermsSection(index)}
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover Seção
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Como Comprar */}
        <TabsContent value="howtobuy" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Título</Label>
                <Input
                  value={pages.how_to_buy?.title || ''}
                  onChange={(e) => updateHowToBuy({ title: e.target.value })}
                  placeholder="Como Comprar"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Subtítulo</Label>
                <Input
                  value={pages.how_to_buy?.subtitle || ''}
                  onChange={(e) => updateHowToBuy({ subtitle: e.target.value })}
                  placeholder="Guia rápido para sua primeira compra"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            {/* Passos */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium text-gray-700">Passos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addHowToBuyStep}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Passo
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {(pages.how_to_buy?.steps || []).map((step, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`step-${index}`}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <span className="text-sm font-medium text-gray-700">
                        Passo {index + 1}: {step.title || 'Sem título'}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 space-y-3">
                      <Input
                        value={step.title}
                        onChange={(e) => updateHowToBuyStep(index, 'title', e.target.value)}
                        placeholder="Título do passo"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                      <Textarea
                        value={step.description}
                        onChange={(e) => updateHowToBuyStep(index, 'description', e.target.value)}
                        placeholder="Descrição do passo..."
                        rows={3}
                        className="text-sm bg-white border-gray-300 resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeHowToBuyStep(index)}
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover Passo
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </TabsContent>

        {/* Tab: FAQ */}
        <TabsContent value="faq" className="mt-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Título</Label>
                <Input
                  value={pages.faq?.title || ''}
                  onChange={(e) => updateFaq({ title: e.target.value })}
                  placeholder="Perguntas Frequentes"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Subtítulo</Label>
                <Input
                  value={pages.faq?.subtitle || ''}
                  onChange={(e) => updateFaq({ subtitle: e.target.value })}
                  placeholder="Tire suas dúvidas"
                  className="h-9 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            {/* Perguntas */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium text-gray-700">Perguntas</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addFaqQuestion}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Pergunta
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {(pages.faq?.questions || []).map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <span className="text-sm font-medium text-gray-700 text-left">
                        {index + 1}. {item.question || 'Pergunta sem título'}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 space-y-3">
                      <Input
                        value={item.question}
                        onChange={(e) => updateFaqQuestion(index, 'question', e.target.value)}
                        placeholder="Pergunta"
                        className="h-8 text-sm bg-white border-gray-300"
                      />
                      <Textarea
                        value={item.answer}
                        onChange={(e) => updateFaqQuestion(index, 'answer', e.target.value)}
                        placeholder="Resposta..."
                        rows={3}
                        className="text-sm bg-white border-gray-300 resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFaqQuestion(index)}
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remover Pergunta
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
