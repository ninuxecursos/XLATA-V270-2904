import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FileText, BookOpen, HelpCircle, Lightbulb, ChevronDown } from 'lucide-react';

interface ArticleTemplatesProps {
  onSelectTemplate: (content: string) => void;
  disabled?: boolean;
}

const TEMPLATES = {
  educacional: {
    name: 'Artigo Educacional',
    icon: BookOpen,
    description: 'Conteúdo profundo (1200+ palavras) para SEO',
    content: `# [Título do Artigo]

[Introdução - 2 a 3 parágrafos contextualizando o tema. Explique a importância do assunto para donos de ferro velho e depósitos de reciclagem. Mencione brevemente o que será abordado no artigo.]

## O Problema

[Descreva o desafio que donos de ferro velho enfrentam em relação a este tema. Use exemplos práticos e situações do dia a dia. Mostre que você entende as dificuldades do setor.]

## A Solução

### Passo 1: [Subtítulo Descritivo]

[Conteúdo detalhado explicando o primeiro passo. Inclua dicas práticas, números quando possível, e exemplos reais.]

### Passo 2: [Subtítulo Descritivo]

[Conteúdo detalhado explicando o segundo passo. Continue mantendo o texto informativo e prático.]

### Passo 3: [Subtítulo Descritivo]

[Conteúdo detalhado explicando o terceiro passo. Mantenha a linguagem acessível para o público-alvo.]

## Exemplos Práticos

[Apresente 2-3 exemplos reais ou simulados que ilustrem como aplicar as soluções apresentadas. Use números, cenários e resultados concretos.]

**Exemplo 1: [Título]**
[Descrição do cenário e resultado]

**Exemplo 2: [Título]**
[Descrição do cenário e resultado]

## Erros Comuns a Evitar

1. **[Erro 1]** - [Explicação de por que isso é um problema e como evitar]
2. **[Erro 2]** - [Explicação de por que isso é um problema e como evitar]
3. **[Erro 3]** - [Explicação de por que isso é um problema e como evitar]

## Ferramentas que Auxiliam

Sistemas de gestão como o [XLata](/solucoes/sistema-para-ferro-velho) auxiliam no controle financeiro e operacional de depósitos de reciclagem, automatizando processos e reduzindo erros manuais.

## Perguntas Frequentes

**Qual é a primeira coisa que devo fazer?**
[Resposta direta e prática]

**Quanto tempo leva para ver resultados?**
[Resposta com expectativas realistas]

**Preciso de conhecimento técnico?**
[Resposta tranquilizadora e orientativa]

## Conclusão

[Resumo dos principais pontos abordados. Reforce a importância do tema e incentive o leitor a tomar ação. Inclua um CTA sutil para conhecer as soluções disponíveis.]

---

*Este artigo foi escrito para ajudar proprietários de ferro velho e depósitos de reciclagem a melhorar sua gestão. Para dúvidas, entre em contato conosco.*`
  },
  
  guia: {
    name: 'Guia Completo',
    icon: FileText,
    description: 'Guia abrangente sobre um tema',
    content: `# Guia Completo: [Título do Tema]

## Introdução

[Apresentação do tema e por que este guia é importante para quem trabalha com reciclagem e ferro velho.]

## O Que Você Vai Aprender

- [Tópico 1]
- [Tópico 2]
- [Tópico 3]
- [Tópico 4]

## Capítulo 1: [Fundamentos]

### O que é [conceito]?

[Definição clara e acessível]

### Por que isso importa?

[Explicação da relevância para o negócio]

## Capítulo 2: [Implementação]

### Preparação

[O que é necessário antes de começar]

### Execução

[Passo a passo detalhado]

## Capítulo 3: [Otimização]

### Métricas Importantes

[Quais indicadores acompanhar]

### Melhorias Contínuas

[Como evoluir constantemente]

## Ferramentas Recomendadas

Para facilitar a gestão, sistemas como o [XLata](/solucoes/sistema-para-ferro-velho) oferecem recursos que automatizam grande parte deste processo.

## FAQ

**Pergunta 1?**
Resposta...

**Pergunta 2?**
Resposta...

## Conclusão e Próximos Passos

[Resumo e ações recomendadas]`
  },
  
  tutorial: {
    name: 'Tutorial Prático',
    icon: Lightbulb,
    description: 'Passo a passo objetivo',
    content: `# Como [Ação] em [Contexto]: Tutorial Completo

## Visão Geral

**Tempo estimado:** X minutos
**Dificuldade:** Iniciante/Intermediário
**Pré-requisitos:** [Lista do que é necessário]

## Materiais Necessários

- [Item 1]
- [Item 2]
- [Item 3]

## Passo 1: [Título]

![Descrição da imagem](url-da-imagem)

[Instruções detalhadas para este passo]

**Dica:** [Dica prática relacionada]

## Passo 2: [Título]

[Instruções detalhadas para este passo]

⚠️ **Atenção:** [Alerta importante se houver]

## Passo 3: [Título]

[Instruções detalhadas para este passo]

## Passo 4: [Título]

[Instruções detalhadas para este passo]

## Resultado Final

[Descrição do que o leitor deve ter alcançado]

## Problemas Comuns

### Problema 1: [Descrição]
**Solução:** [Como resolver]

### Problema 2: [Descrição]
**Solução:** [Como resolver]

## Próximos Passos

Para automatizar este processo, considere utilizar um [sistema de gestão para ferro velho](/solucoes/sistema-para-ferro-velho).

## Conclusão

[Resumo do que foi aprendido e encorajamento]`
  },
  
  faq: {
    name: 'FAQ Detalhado',
    icon: HelpCircle,
    description: 'Perguntas frequentes expandidas',
    content: `# [Tema]: Perguntas Frequentes (FAQ Completo)

## Introdução

[Breve introdução explicando por que estas perguntas são importantes e como este FAQ pode ajudar.]

---

## Perguntas Básicas

### O que é [conceito principal]?

[Resposta detalhada de 2-3 parágrafos]

### Para quem é indicado?

[Resposta explicando o público-alvo]

### Quais são os benefícios?

[Lista de benefícios principais:]
- Benefício 1
- Benefício 2
- Benefício 3

---

## Perguntas sobre Implementação

### Como começar?

[Passo a passo inicial]

### Quanto custa?

[Informações sobre custos e investimento]

### Quanto tempo leva?

[Expectativas realistas de prazo]

---

## Perguntas sobre Resultados

### Quais resultados posso esperar?

[Descrição de resultados típicos com exemplos]

### Em quanto tempo verei retorno?

[Expectativas de prazo para ROI]

---

## Perguntas sobre Ferramentas

### Preciso de algum sistema específico?

Embora seja possível fazer manualmente, sistemas como o [XLata](/solucoes/sistema-para-ferro-velho) facilitam significativamente o processo.

### E se eu tiver mais dúvidas?

[Informações de contato ou suporte]

---

## Conclusão

[Resumo e incentivo para ação]`
  }
};

export const ArticleTemplates: React.FC<ArticleTemplatesProps> = ({ onSelectTemplate, disabled }) => {
  const handleSelect = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    if (confirm(`Inserir o template "${template.name}"? Isso substituirá o conteúdo atual.`)) {
      onSelectTemplate(template.content);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
        >
          <FileText className="h-4 w-4 mr-2" />
          Templates
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-gray-800 border-gray-700">
        <DropdownMenuLabel className="text-gray-400 text-xs">
          Selecione um template para começar
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        {Object.entries(TEMPLATES).map(([key, template]) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleSelect(key as keyof typeof TEMPLATES)}
              className="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
            >
              <Icon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">{template.name}</p>
                <p className="text-xs text-gray-400">{template.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ArticleTemplates;
