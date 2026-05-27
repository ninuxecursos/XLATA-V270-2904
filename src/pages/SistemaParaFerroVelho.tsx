import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Check, AlertTriangle, TrendingUp, Shield, 
  Smartphone, Calculator, Users, Star, ChevronDown, ChevronUp,
  DollarSign, BarChart3, Package, Scale, WifiOff, ShoppingCart,
  Lock, Headphones, X, FileText, Boxes, UserCheck, Wallet
} from 'lucide-react';
import { useState } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { WhatsAppButton } from '@/components/shop/public/WhatsAppButton';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const FAQ_ITEMS = [
  { q: 'É difícil de usar?', a: 'Não! O XLata foi feito para donos de ferro velho, não para programadores. Interface simples, direto ao ponto. Em 5 minutos você já está usando.' },
  { q: 'Precisa de internet o tempo todo?', a: 'O XLata funciona mesmo com internet instável. Você pode registrar pesagens e consultar dados mesmo offline. Quando a internet voltar, tudo sincroniza automaticamente.' },
  { q: 'Funciona no celular?', a: 'Sim! 100% responsivo. Funciona no celular, tablet e computador. A maioria dos nossos clientes usa direto pelo celular no pátio.' },
  { q: 'Posso testar antes de pagar?', a: 'Sim! Você tem 7 dias grátis para testar tudo, sem precisar colocar cartão de crédito. Se não gostar, é só parar de usar.' },
  { q: 'Tem suporte?', a: 'Sim! Suporte direto pelo WhatsApp com pessoas reais que entendem de ferro velho. Nada de robô ou esperar dias por resposta.' },
  { q: 'Quantos funcionários podem usar?', a: 'Depende do plano. No plano PRO você adiciona funcionários com permissões personalizadas — cada um acessa só o que você permitir.' },
  { q: 'Serve para depósito pequeno?', a: 'Sim! O XLata serve para qualquer tamanho de depósito. Seja 1 pessoa ou 20 funcionários, o sistema se adapta ao seu negócio.' },
  { q: 'Posso controlar mais de uma unidade?', a: 'Sim! O XLata permite gerenciar múltiplas unidades em um único painel, com controle separado de estoque, caixa e funcionários.' },
];

const PAIN_POINTS = [
  { icon: Calculator, title: 'Erro no cálculo do preço', desc: 'Conta de cabeça ou calculadora solta gera erro. Cada centavo errado por quilo vira centenas de reais de prejuízo por mês.' },
  { icon: AlertTriangle, title: 'Estoque que não bate', desc: 'Você compra 500kg de cobre, mas quando vai vender tem 450kg. Para onde foi o resto? Sem sistema, você nunca vai saber.' },
  { icon: Lock, title: 'Roubos e desvios internos', desc: 'Funcionário que registra peso menor, que some com material, que dá desconto sem autorização. Sem controle, você paga a conta.' },
  { icon: DollarSign, title: 'Fiado descontrolado', desc: 'Quanto te devem? Quem pagou? Quem não pagou? Se você precisa pensar para responder, está perdendo dinheiro.' },
  { icon: Wallet, title: 'Caixa no escuro', desc: 'Você trabalha o dia inteiro e no final não sabe se lucrou ou se ficou no zero. O dinheiro entra e sai sem controle.' },
  { icon: BarChart3, title: 'Decisão no achismo', desc: 'Qual material dá mais lucro? Qual cliente compra mais? Qual dia vende mais? Sem dados, você decide no escuro.' },
];

const BENEFITS = [
  { icon: Package, title: 'Sabe exatamente o que tem no pátio', desc: 'Estoque atualizado em tempo real. Cada quilo que entra e sai é registrado. Acabou o "sumiu e ninguém sabe".' },
  { icon: DollarSign, title: 'Nunca mais fica no escuro sobre seu lucro', desc: 'O sistema calcula seu lucro automaticamente. Você sabe quanto ganhou hoje, essa semana, esse mês. Sem achismo.' },
  { icon: Shield, title: 'Protege contra roubos e desvios', desc: 'Cada movimentação fica registrada com data, hora e quem fez. Se alguém tentar desviar, você descobre.' },
  { icon: UserCheck, title: 'Controle total dos clientes e fornecedores', desc: 'Histórico completo de cada pessoa. Quanto comprou, quanto vendeu, quanto deve. Tudo organizado.' },
  { icon: TrendingUp, title: 'Decide melhor e vende mais caro', desc: 'Relatórios claros mostram qual material dá mais lucro, qual época vende mais, onde cortar custo. Dados que viram dinheiro.' },
  { icon: Scale, title: 'Pesagem precisa e sem erro', desc: 'Integração com balança digital. O peso vai direto pro sistema, sem digitação manual, sem erro humano.' },
];

const FEATURES = [
  { icon: ShoppingCart, title: 'Compras e Vendas', desc: 'Registre cada operação com preço, peso e material. Cálculo automático.' },
  { icon: Boxes, title: 'Controle de Materiais', desc: 'Cadastre todos os tipos de sucata com preço por quilo atualizado.' },
  { icon: Users, title: 'Gestão de Clientes', desc: 'Cadastro completo com histórico, débitos e contato rápido por WhatsApp.' },
  { icon: Wallet, title: 'Caixa Completo', desc: 'Abertura, fechamento, entradas e saídas. Controle total do dinheiro.' },
  { icon: BarChart3, title: 'Relatórios de Lucro', desc: 'Lucro por material, por período, por cliente. Dashboards visuais.' },
  { icon: Scale, title: 'Integração com Balança', desc: 'Conecte sua balança digital e elimine erros de digitação.' },
  { icon: FileText, title: 'Comprovantes Automáticos', desc: 'Gere comprovantes de compra e venda com um toque.' },
  { icon: WifiOff, title: 'Funciona Offline', desc: 'Internet caiu? Sem problema. O sistema continua funcionando.' },
];

const TESTIMONIALS = [
  { name: 'Carlos M.', city: 'São Paulo - SP', text: 'Antes eu usava caderno e vivia perdido. Agora sei exatamente quanto lucrei no dia. Em 2 meses já recuperei o investimento.' },
  { name: 'Roberto S.', city: 'Belo Horizonte - MG', text: 'Descobri que meu funcionário estava desviando material. Com o XLata, cada quilo é registrado. Nunca mais tive esse problema.' },
  { name: 'Marcos L.', city: 'Curitiba - PR', text: 'Sistema simples demais. Mostrei pro meu pai de 62 anos e ele aprendeu a usar em 10 minutos. Funciona no celular, no pátio mesmo.' },
  { name: 'Anderson R.', city: 'Goiânia - GO', text: 'Já testei 3 sistemas diferentes. Todos complicados e genéricos. O XLata é o único que foi feito pra ferro velho de verdade.' },
];

export default function SistemaParaFerroVelho() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTA = () => navigate('/register');

  return (
    <PublicLayout showFooter={true}>
      <Helmet>
        <title>Sistema para Ferro Velho | Software para Reciclagem e Sucata | XLata</title>
        <meta name="description" content="Sistema completo para ferro velho, reciclagem e sucata. Controle pesagens, estoque, caixa e lucro. Funciona offline e no celular. Teste grátis 7 dias sem cartão." />
        <link rel="canonical" href="https://xlata.site/sistema-para-ferro-velho" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "XLata - Sistema para Ferro Velho",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "Sistema de gestão completo para depósitos de reciclagem, ferro velho e sucata.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL", "description": "7 dias grátis sem cartão" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "130" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_ITEMS.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": { "@type": "Answer", "text": item.a }
          }))
        })}</script>
      </Helmet>

      {/* WhatsApp Flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <WhatsAppButton variant="icon" className="w-14 h-14 shadow-2xl" />
      </div>

      {/* ===== 1. HERO ===== */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Seu ferro velho pode estar perdendo dinheiro agora</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Pare de <span className="text-red-400">perder dinheiro</span> no seu ferro velho <span className="text-emerald-400">sem perceber</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-3 max-w-3xl mx-auto">
              O XLata é o sistema para ferro velho que controla pesagens, estoque, caixa e lucro — tudo pelo celular.
            </p>
            <p className="text-emerald-400 font-semibold text-lg mb-10">
              Mais de 130 depósitos de reciclagem já usam o XLata para lucrar mais.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" onClick={handleCTA} className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-7 text-xl font-bold shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all rounded-xl">
                Quero Testar Grátis por 7 Dias
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <WhatsAppButton variant="full" label="Falar no WhatsApp" className="py-7 text-lg rounded-xl" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Funciona no celular</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Funciona offline</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 2. SEÇÃO DE DOR ===== */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-red-950/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Você se identifica com algum desses problemas?</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Se você respondeu "sim" para pelo menos um, está deixando dinheiro na mesa todos os dias.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAIN_POINTS.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}>
                <div className="bg-slate-800/50 border border-red-500/20 rounded-2xl p-7 h-full hover:border-red-500/40 transition-all">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. APRESENTAÇÃO DO XLATA ===== */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              O XLata foi criado <span className="text-emerald-400">especificamente</span> para ferro velho
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6 max-w-3xl mx-auto">
              Diferente de sistemas genéricos feitos para loja, restaurante ou escritório, o XLata nasceu dentro de um depósito de reciclagem. Cada botão, cada tela, cada cálculo foi pensado para quem trabalha com sucata no dia a dia.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-3xl mx-auto">
              Aqui não tem menu complicado, função inútil ou linguagem de programador. O XLata fala a sua língua: <strong className="text-emerald-400">quilo, preço, peso, lucro</strong>. Simples assim.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleCTA} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-bold rounded-xl hover:scale-105 transition-all">
                Quero Conhecer o XLata
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <WhatsAppButton variant="full" label="Tirar Dúvidas no WhatsApp" className="py-6 text-lg rounded-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 4. BENEFÍCIOS ===== */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">O que muda quando você usa o XLata</h2>
            <p className="text-slate-400 text-lg">Não são só funções — são resultados reais no seu bolso</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-7 h-full hover:border-emerald-500/40 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. FUNCIONALIDADES ===== */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tudo que seu depósito de reciclagem precisa</h2>
            <p className="text-slate-400 text-lg">Software para sucata completo — sem precisar de mais nada</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.5, delay: i * 0.08 } } }}>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-center h-full hover:border-emerald-500/30 transition-all">
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" onClick={handleCTA} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-bold rounded-xl hover:scale-105 transition-all">
              Testar Todas as Funções — É Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== 6. COMPARAÇÃO INDIRETA ===== */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">XLata vs. Sistemas Genéricos</h2>
            <p className="text-slate-400 text-lg">Enquanto outros sistemas são feitos para qualquer negócio, o XLata é feito para o seu</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="grid grid-cols-3 text-center font-bold text-sm md:text-base">
                <div className="p-4 bg-slate-700/50 text-slate-300">Recurso</div>
                <div className="p-4 bg-slate-700/50 text-red-400">Sistemas Genéricos</div>
                <div className="p-4 bg-emerald-500/20 text-emerald-400">XLata</div>
              </div>
              {[
                ['Feito para ferro velho', false, true],
                ['Pesagem por quilo', false, true],
                ['Funciona offline', false, true],
                ['Controle de sucata', false, true],
                ['Lucro automático', false, true],
                ['Fácil de usar', false, true],
                ['Integração com balança', false, true],
                ['Suporte pelo WhatsApp', false, true],
              ].map(([label, generic, xlata], i) => (
                <div key={i} className={`grid grid-cols-3 text-center text-sm md:text-base ${i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/60'}`}>
                  <div className="p-3.5 text-slate-300 text-left pl-5 font-medium">{label as string}</div>
                  <div className="p-3.5 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="p-3.5 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 7. PROVA SOCIAL ===== */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Quem usa o XLata, não volta pro caderno</h2>
            <p className="text-slate-400 text-lg">Veja o que donos de ferro velho estão falando</p>
          </motion.div>
          {/* Métricas */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Users, value: '130+', label: 'Depósitos usando o XLata' },
              { icon: Star, value: '4.9/5', label: 'Avaliação média dos clientes' },
              { icon: Package, value: '23.000+', label: 'Pesagens registradas' },
            ].map((m, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.5, delay: i * 0.15 } } }}>
                <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700">
                  <m.icon className={`w-10 h-10 mx-auto mb-3 ${i === 1 ? 'text-yellow-400' : 'text-emerald-400'}`} />
                  <div className="text-4xl font-bold text-white mb-1">{m.value}</div>
                  <p className="text-slate-400">{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Depoimentos */}
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.5, delay: i * 0.1 } } }}>
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 h-full">
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-slate-300 mb-4 italic leading-relaxed">"{t.text}"</p>
                  <p className="text-emerald-400 font-semibold">{t.name} — {t.city}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. QUEBRA DE OBJEÇÕES ===== */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ainda tem dúvida? A gente responde</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Smartphone, q: '"É difícil de usar?"', a: 'Se você sabe usar WhatsApp, sabe usar o XLata. Simples assim. Sem tela complicada, sem menu escondido.' },
              { icon: WifiOff, q: '"Precisa de internet?"', a: 'Funciona mesmo offline. A internet caiu no seu pátio? Sem problema. Continue registrando normalmente.' },
              { icon: DollarSign, q: '"Posso testar de graça?"', a: '7 dias grátis, sem cartão de crédito. Teste tudo sem compromisso. Se não gostar, não paga nada.' },
              { icon: Headphones, q: '"E se eu precisar de ajuda?"', a: 'Suporte direto pelo WhatsApp com pessoas reais. Nada de robô, nada de esperar 3 dias por email.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { duration: 0.5, delay: i * 0.1 } } }}>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-7 h-full">
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.q}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. FAQ ===== */}
      <section className="py-20 bg-slate-800">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Perguntas Frequentes sobre o Sistema para Ferro Velho</h2>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-white font-medium pr-4">{item.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-slate-400 leading-relaxed">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 10. CTA FINAL ===== */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl px-8 py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ou você controla seu ferro velho… ou continua perdendo dinheiro todos os dias.</h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">Cada dia sem sistema é um dia que você perde dinheiro sem saber. Comece agora — é grátis.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button size="lg" onClick={handleCTA} className="bg-white text-emerald-700 hover:bg-emerald-50 px-10 py-7 text-xl font-bold shadow-lg hover:scale-105 transition-all rounded-xl">
                  Quero Parar de Perder Dinheiro
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </div>
              <WhatsAppButton variant="full" label="Falar com um Especialista no WhatsApp" className="mx-auto max-w-md bg-white/10 border-white/30 text-white hover:bg-white/20 py-6 text-lg rounded-xl" />
              <div className="flex flex-wrap justify-center gap-6 text-emerald-100 mt-8 text-sm">
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Sem cartão</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> 7 dias grátis</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Funciona no celular</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Funciona offline</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
