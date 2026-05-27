import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Static definitions that don't change
const APP_ROUTES = [
  { path: '/', desc: 'Landing Page principal' },
  { path: '/login', desc: 'Autenticação de usuários' },
  { path: '/register', desc: 'Cadastro de novos usuários' },
  { path: '/reset-password', desc: 'Recuperação de senha' },
  { path: '/planos', desc: 'Exibição de planos e preços' },
  { path: '/pdv', desc: 'Ponto de Venda / Caixa registradora' },
  { path: '/materiais', desc: 'Gestão de materiais e preços' },
  { path: '/configuracoes', desc: 'Configurações do sistema' },
  { path: '/dashboard', desc: 'Dashboard gerencial (PRO)' },
  { path: '/current-stock', desc: 'Estoque atual (PRO)' },
  { path: '/purchase-orders', desc: 'Ordens de compra (PRO)' },
  { path: '/sales-orders', desc: 'Ordens de venda (PRO)' },
  { path: '/transactions', desc: 'Histórico de transações (PRO)' },
  { path: '/expenses', desc: 'Gestão de despesas' },
  { path: '/daily-flow', desc: 'Fluxo de caixa diário (PRO)' },
  { path: '/cash-additions', desc: 'Adições de caixa' },
  { path: '/clientes', desc: 'Gestão de clientes (PRO)' },
  { path: '/funcionarios', desc: 'Gestão de funcionários (PRO)' },
  { path: '/sistema-indicacoes', desc: 'Sistema de indicações' },
  { path: '/relatar-erro', desc: 'Relatório de erros' },
  { path: '/ajuda', desc: 'Central de ajuda' },
  { path: '/blog', desc: 'Blog institucional' },
  { path: '/glossario', desc: 'Glossário de termos' },
  { path: '/solucoes', desc: 'Páginas de soluções' },
  { path: '/shop', desc: 'E-commerce / Loja virtual' },
  { path: '/shop-cms', desc: 'CMS da loja' },
  { path: '/covildomal', desc: 'Painel administrativo master' },
  { path: '/guia-completo', desc: 'Guia completo do sistema' },
  { path: '/instalar', desc: 'Página de instalação PWA' },
];

const MODULES = [
  {
    name: 'PDV (Ponto de Venda)',
    desc: 'Sistema de caixa registradora com abertura/fechamento, registro de vendas, múltiplos métodos de pagamento (dinheiro, PIX, cartão), impressão de comprovantes, gestão de troco.',
    tables: ['orders', 'order_items', 'cash_registers', 'cash_transactions', 'pdv_sessions', 'pdv_access_config', 'receipt_format_settings'],
  },
  {
    name: 'Gestão de Materiais',
    desc: 'Cadastro e precificação de materiais recicláveis com categorias, histórico de preços, configurações por usuário.',
    tables: ['materials', 'material_categories', 'material_price_history', 'user_material_settings'],
  },
  {
    name: 'Estoque',
    desc: 'Controle de estoque em tempo real com ordens de compra e venda, histórico de movimentações.',
    tables: ['orders', 'order_items', 'order_cancellations', 'order_reprints'],
  },
  {
    name: 'Financeiro',
    desc: 'Dashboard financeiro com receitas, despesas, fluxo de caixa, balanço, pagamentos via Mercado Pago (PIX e Cartão).',
    tables: ['payment_ledger', 'mercado_pago_payments', 'order_payments', 'order_payment_details', 'payment_gateway_config'],
  },
  {
    name: 'Clientes',
    desc: 'Cadastro de clientes do depósito com CPF, WhatsApp, endereço, histórico de compras, total gasto.',
    tables: ['depot_clients', 'customers', 'campaign_clients'],
  },
  {
    name: 'Funcionários',
    desc: 'Gestão de funcionários com permissões granulares, logs de ações, slots pagos, login independente.',
    tables: ['depot_employees', 'employee_permissions', 'employee_action_logs', 'employee_slots'],
  },
  {
    name: 'Campanhas',
    desc: 'Sistema de campanha de coleta com períodos, entregas, vouchers, acumulação de valores.',
    tables: ['campaign_clients', 'campaign_deliveries', 'campaign_materials', 'campaign_periods', 'campaign_vouchers'],
  },
  {
    name: 'Assinaturas & Planos',
    desc: 'Sistema de planos (Essencial, PRO), período de teste 7 dias, gestão de assinaturas, chaves de ativação.',
    tables: ['subscription_plans', 'subscription_tiers', 'subscriptions', 'user_subscriptions', 'assinaturas', 'activation_keys', 'tier_features'],
  },
  {
    name: 'Blog & SEO',
    desc: 'CMS de blog com categorias, artigos, geração automática por IA, SEO programático (~7.000 páginas), glossário, pillar pages.',
    tables: ['blog_posts', 'blog_categories', 'pillar_pages', 'glossary_terms', 'seo_configurations', 'seo_topic_bank', 'static_pages_seo'],
  },
  {
    name: 'SEO Local',
    desc: 'Páginas de SEO local por cidade/estado para captura de tráfego geolocalizado.',
    tables: ['local_seo_cities', 'local_seo_pages', 'local_seo_states'],
  },
  {
    name: 'E-commerce (Shop)',
    desc: 'Loja virtual com produtos, categorias, carrinho, checkout, pagamentos, favoritos, avaliações, ofertas interativas.',
    tables: ['shop_products', 'shop_categories', 'shop_orders', 'shop_order_items', 'shop_config', 'shop_user_favorites', 'shop_product_reviews', 'shop_product_rating_stats', 'shop_interactive_offers'],
  },
  {
    name: 'Landing Page',
    desc: 'Landing page dinâmica com seções configuráveis: hero, KPIs, problemas, como funciona, FAQ, depoimentos, vídeos, CTA final.',
    tables: ['global_landing_settings', 'landing_page_settings', 'landing_sections', 'landing_kpis', 'landing_problems', 'landing_how_it_works', 'landing_faq', 'landing_testimonials', 'landing_videos', 'landing_cta_final', 'landing_footer_settings'],
  },
  {
    name: 'Segurança',
    desc: 'Dashboard de segurança com logs de acesso, auditoria, bloqueios IP, rate limiting, RBAC com 4 níveis de admin.',
    tables: ['admin_access_logs', 'admin_audit_logs', 'admin_user_roles', 'security_blocks', 'rate_limit_attempts', 'audit_log', 'active_sessions'],
  },
  {
    name: 'Notificações',
    desc: 'Sistema de notificações com mensagens broadcast, notificações globais, mensagens diretas admin→usuário.',
    tables: ['admin_messages', 'admin_message_recipients', 'admin_realtime_messages', 'global_notifications', 'global_notification_recipients', 'user_notifications', 'user_direct_messages'],
  },
  {
    name: 'Analytics',
    desc: 'Rastreamento de eventos, presença de usuários online, lifecycle de usuários.',
    tables: ['analytics_events', 'user_presence', 'user_lifecycle'],
  },
  {
    name: 'IA & Automação',
    desc: 'Geração automática de artigos SEO via Gemini, geração de imagens, transcrição de áudio, prompts configuráveis.',
    tables: ['ai_automation_config', 'ai_usage_log', 'article_generation_log', 'image_studio_prompts'],
  },
  {
    name: 'Telegram Bot',
    desc: 'Bot Telegram para cadastro de produtos via foto, buffer de processamento, wizard de sessões.',
    tables: ['telegram_bot_config', 'telegram_product_buffer', 'telegram_product_pending', 'telegram_wizard_sessions'],
  },
  {
    name: 'Pinterest',
    desc: 'Integração com Pinterest para publicação automática de pins, OAuth, boards por categoria.',
    tables: ['pinterest_config', 'pinterest_category_boards', 'pinterest_pins_log'],
  },
  {
    name: 'Unidades',
    desc: 'Suporte multi-unidade para gestão de filiais do depósito.',
    tables: ['unidades', 'unidade_sessions'],
  },
  {
    name: 'Indicações',
    desc: 'Sistema de indicações com recompensas configuráveis pelo admin.',
    tables: ['recompensas_indicacao', 'referral_settings'],
  },
  {
    name: 'Ajuda',
    desc: 'Central de ajuda com categorias, artigos, vídeos tutoriais, progresso do usuário.',
    tables: ['help_articles', 'help_categories', 'guide_videos', 'guide_page_settings', 'user_video_progress'],
  },
];

// Edge functions discovered from the project
const EDGE_FUNCTIONS = [
  'admin-confirm-user', 'auto-publish-articles', 'check-rate-limit',
  'cleanup-abandoned-orders', 'create-card-payment', 'create-employee-user',
  'create-pix-payment', 'create-shop-card-payment', 'create-shop-pix-payment',
  'export-user-data', 'follow-up-pending-pix', 'generate-article-image',
  'generate-local-seo-content', 'generate-product-studio-image',
  'generate-seo-article', 'generate-sitemap', 'get-admin-payments',
  'get-client-ip', 'get-payment-status', 'get-system-stats',
  'pinterest-callback', 'pinterest-oauth', 'pinterest-publish-pin',
  'prerender', 'process-interactive-events', 'process-telegram-block',
  'process-telegram-product', 'seed-shop-products', 'test-ai-connection',
  'test-payment-connection', 'transcribe-audio', 'update-shop-images',
  'webhook-mercado-pago', 'webhook-telegram-products',
];

interface LiveStats {
  totalUsers: number;
  totalOrders: number;
  totalMaterials: number;
  totalBlogPosts: number;
  totalProducts: number;
  onlineUsers: number;
  activeSubscriptions: number;
  totalCustomers: number;
  totalEmployees: number;
  totalCategories: number;
  totalGlossaryTerms: number;
  totalHelpArticles: number;
  totalLocalSeoPages: number;
  totalLocalSeoCities: number;
  totalLocalSeoStates: number;
  totalPillarPages: number;
  totalTableCount: number;
  totalFunctions: number;
  databaseSize: string;
  systemVersion: string;
  generatedAt: string;
}

async function fetchLiveStats(): Promise<LiveStats> {
  const now = new Date().toLocaleString('pt-BR');

  // Batch all queries in parallel for speed
  const [
    users, orders, materials, posts, products, onlinePresence,
    activeSubs, customers, employees, blogCategories,
    glossaryTerms, helpArticles, localSeoPages, localSeoCities,
    localSeoStates, pillarPages, config, tableCountResult,
    functionCountResult, dbStatsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('materials').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('shop_products').select('id', { count: 'exact', head: true }),
    supabase.from('user_presence').select('id', { count: 'exact', head: true }).eq('is_online', true).gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('expires_at', new Date().toISOString()),
    supabase.from('depot_clients').select('id', { count: 'exact', head: true }),
    supabase.from('depot_employees').select('id', { count: 'exact', head: true }),
    supabase.from('blog_categories').select('id', { count: 'exact', head: true }),
    supabase.from('glossary_terms').select('id', { count: 'exact', head: true }),
    supabase.from('help_articles').select('id', { count: 'exact', head: true }),
    supabase.from('local_seo_pages').select('id', { count: 'exact', head: true }),
    supabase.from('local_seo_cities').select('id', { count: 'exact', head: true }),
    supabase.from('local_seo_states').select('id', { count: 'exact', head: true }),
    supabase.from('pillar_pages').select('id', { count: 'exact', head: true }),
    supabase.from('admin_system_config').select('system_version').limit(1).single(),
    supabase.rpc('get_table_count'),
    supabase.rpc('get_function_count'),
    supabase.rpc('get_database_statistics'),
  ]);

  const tableCount = (tableCountResult.data as any)?.count ?? 0;
  const functionCount = (functionCountResult.data as any)?.count ?? 0;
  const dbSize = (dbStatsResult.data as any)?.database_size ?? 'N/A';

  return {
    totalUsers: users.count ?? 0,
    totalOrders: orders.count ?? 0,
    totalMaterials: materials.count ?? 0,
    totalBlogPosts: posts.count ?? 0,
    totalProducts: products.count ?? 0,
    onlineUsers: onlinePresence.count ?? 0,
    activeSubscriptions: activeSubs.count ?? 0,
    totalCustomers: customers.count ?? 0,
    totalEmployees: employees.count ?? 0,
    totalCategories: blogCategories.count ?? 0,
    totalGlossaryTerms: glossaryTerms.count ?? 0,
    totalHelpArticles: helpArticles.count ?? 0,
    totalLocalSeoPages: localSeoPages.count ?? 0,
    totalLocalSeoCities: localSeoCities.count ?? 0,
    totalLocalSeoStates: localSeoStates.count ?? 0,
    totalPillarPages: pillarPages.count ?? 0,
    totalTableCount: tableCount,
    totalFunctions: functionCount,
    databaseSize: dbSize,
    systemVersion: config.data?.system_version ?? 'N/A',
    generatedAt: now,
  };
}

function getEdgeFunctionCategory(name: string): string {
  if (name.includes('payment') || name.includes('pix') || name.includes('card') || name.includes('mercado')) return 'Pagamentos';
  if (name.includes('seo') || name.includes('article') || name.includes('sitemap') || name.includes('publish') || name.includes('prerender')) return 'SEO & Conteúdo';
  if (name.includes('telegram')) return 'Telegram Bot';
  if (name.includes('pinterest')) return 'Pinterest';
  if (name.includes('shop') || name.includes('product')) return 'E-commerce';
  if (name.includes('employee') || name.includes('user') || name.includes('admin')) return 'Usuários & Admin';
  if (name.includes('ai') || name.includes('image') || name.includes('transcribe')) return 'IA & Mídia';
  return 'Sistema';
}

function buildDocumentHTML(stats: LiveStats): string {
  const allModuleTables = new Set(MODULES.flatMap(m => m.tables));

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 11px; }
  .cover { text-align: center; padding: 80px 40px; page-break-after: always; }
  .cover h1 { font-size: 32px; color: #dc2626; margin-bottom: 8px; }
  .cover h2 { font-size: 18px; color: #666; font-weight: 400; }
  .cover .meta { margin-top: 60px; color: #888; font-size: 12px; }
  .cover .meta p { margin: 4px 0; }
  h2 { color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 4px; margin-top: 28px; font-size: 16px; page-break-after: avoid; }
  h3 { color: #333; margin-top: 16px; font-size: 13px; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 10px; }
  th { background: #dc2626; color: white; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) { background: #fafafa; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .stat-card { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-card .value { font-size: 24px; font-weight: 700; color: #dc2626; }
  .stat-card .label { font-size: 10px; color: #666; }
  .module-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin: 8px 0; page-break-inside: avoid; }
  .module-card h3 { margin: 0 0 4px; color: #dc2626; }
  .module-card p { margin: 0 0 6px; color: #555; font-size: 10.5px; }
  .tag { display: inline-block; background: #fef2f2; color: #dc2626; padding: 1px 6px; border-radius: 4px; font-size: 9px; margin: 1px; }
  .toc { page-break-after: always; }
  .toc li { margin: 4px 0; }
  .footer { text-align: center; color: #aaa; font-size: 9px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 8px; }
  .realtime-badge { display: inline-block; background: #22c55e; color: white; padding: 2px 8px; border-radius: 10px; font-size: 9px; margin-left: 6px; }
  .db-info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin: 12px 0; }
  .db-info strong { color: #0369a1; }
</style>
</head>
<body>

<div class="cover">
  <h1>📄 XLata — Documentação Completa do Sistema</h1>
  <h2>Documentação Técnica com Dados em Tempo Real</h2>
  <div class="meta">
    <p>Gerado automaticamente em: <strong>${stats.generatedAt}</strong></p>
    <p>Versão do Sistema: <strong>${stats.systemVersion}</strong></p>
    <p>Tamanho do Banco: <strong>${stats.databaseSize}</strong></p>
    <p>Tabelas no Banco: <strong>${stats.totalTableCount}</strong> | Functions SQL: <strong>${stats.totalFunctions}</strong></p>
    <p style="margin-top: 20px;">Documento confidencial — uso interno</p>
  </div>
</div>

<div class="toc">
  <h2>📋 Índice</h2>
  <ol>
    <li>Visão Geral & Estatísticas em Tempo Real</li>
    <li>Arquitetura Técnica</li>
    <li>Módulos do Sistema (${MODULES.length})</li>
    <li>Rotas da Aplicação (${APP_ROUTES.length})</li>
    <li>Banco de Dados — Tabelas (${stats.totalTableCount})</li>
    <li>Edge Functions (${EDGE_FUNCTIONS.length})</li>
    <li>Planos & Permissões</li>
    <li>Segurança & Infraestrutura</li>
    <li>Integrações Externas</li>
    <li>Stack Tecnológica</li>
  </ol>
</div>

<h2>1. Visão Geral & Estatísticas em Tempo Real <span class="realtime-badge">● LIVE</span></h2>
<div class="stat-grid">
  <div class="stat-card"><div class="value">${stats.totalUsers.toLocaleString('pt-BR')}</div><div class="label">Usuários Registrados</div></div>
  <div class="stat-card"><div class="value">${stats.totalOrders.toLocaleString('pt-BR')}</div><div class="label">Pedidos Totais</div></div>
  <div class="stat-card"><div class="value">${stats.totalMaterials.toLocaleString('pt-BR')}</div><div class="label">Materiais Cadastrados</div></div>
  <div class="stat-card"><div class="value">${stats.totalBlogPosts.toLocaleString('pt-BR')}</div><div class="label">Posts do Blog</div></div>
  <div class="stat-card"><div class="value">${stats.totalProducts.toLocaleString('pt-BR')}</div><div class="label">Produtos na Loja</div></div>
  <div class="stat-card"><div class="value">${stats.onlineUsers.toLocaleString('pt-BR')}</div><div class="label">Usuários Online Agora</div></div>
</div>
<div class="stat-grid">
  <div class="stat-card"><div class="value">${stats.activeSubscriptions.toLocaleString('pt-BR')}</div><div class="label">Assinaturas Ativas</div></div>
  <div class="stat-card"><div class="value">${stats.totalCustomers.toLocaleString('pt-BR')}</div><div class="label">Clientes Cadastrados</div></div>
  <div class="stat-card"><div class="value">${stats.totalEmployees.toLocaleString('pt-BR')}</div><div class="label">Funcionários</div></div>
</div>
<div class="db-info">
  <strong>Banco de Dados:</strong> ${stats.databaseSize} | 
  <strong>Tabelas:</strong> ${stats.totalTableCount} | 
  <strong>Functions SQL:</strong> ${stats.totalFunctions} | 
  <strong>Edge Functions:</strong> ${EDGE_FUNCTIONS.length} | 
  <strong>Rotas:</strong> ${APP_ROUTES.length} | 
  <strong>Módulos:</strong> ${MODULES.length}
</div>

<h3>Contagem de Conteúdo</h3>
<table>
  <tr><th>Recurso</th><th>Quantidade</th></tr>
  <tr><td>Categorias do Blog</td><td>${stats.totalCategories}</td></tr>
  <tr><td>Termos do Glossário</td><td>${stats.totalGlossaryTerms}</td></tr>
  <tr><td>Artigos de Ajuda</td><td>${stats.totalHelpArticles}</td></tr>
  <tr><td>Pillar Pages</td><td>${stats.totalPillarPages}</td></tr>
  <tr><td>Páginas SEO Local</td><td>${stats.totalLocalSeoPages}</td></tr>
  <tr><td>Cidades SEO Local</td><td>${stats.totalLocalSeoCities}</td></tr>
  <tr><td>Estados SEO Local</td><td>${stats.totalLocalSeoStates}</td></tr>
</table>

<h2>2. Arquitetura Técnica</h2>
<table>
  <tr><th>Camada</th><th>Tecnologia</th><th>Descrição</th></tr>
  <tr><td>Frontend</td><td>React 18 + TypeScript + Vite</td><td>SPA com code-splitting, lazy loading, PWA</td></tr>
  <tr><td>Estilização</td><td>Tailwind CSS + shadcn/ui</td><td>Design system com tokens semânticos, dark mode</td></tr>
  <tr><td>Estado</td><td>TanStack Query + React hooks</td><td>Cache inteligente, real-time via Supabase channels</td></tr>
  <tr><td>Backend</td><td>Supabase (PostgreSQL)</td><td>Auth, DB, Storage, Edge Functions, Realtime</td></tr>
  <tr><td>Pagamentos</td><td>Mercado Pago</td><td>PIX e Cartão de crédito via API v1</td></tr>
  <tr><td>IA</td><td>Google Gemini</td><td>Geração de artigos, imagens, transcrição</td></tr>
  <tr><td>SEO</td><td>Programático</td><td>~7.000 páginas geradas automaticamente</td></tr>
  <tr><td>Animações</td><td>Framer Motion</td><td>Transições e micro-interações</td></tr>
  <tr><td>Gráficos</td><td>Recharts</td><td>Dashboards e visualizações de dados</td></tr>
</table>

<h2>3. Módulos do Sistema</h2>
${MODULES.map((m, i) => `
<div class="module-card">
  <h3>${i + 1}. ${m.name}</h3>
  <p>${m.desc}</p>
  <div>${m.tables.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>
</div>
`).join('')}

<h2>4. Rotas da Aplicação</h2>
<table>
  <tr><th>#</th><th>Rota</th><th>Descrição</th></tr>
  ${APP_ROUTES.map((r, i) => `<tr><td>${i + 1}</td><td><code>${r.path}</code></td><td>${r.desc}</td></tr>`).join('')}
</table>

<h2>5. Banco de Dados — Tabelas (${stats.totalTableCount}) <span class="realtime-badge">● LIVE</span></h2>
<p><em>Total de tabelas reais no schema público: <strong>${stats.totalTableCount}</strong> (consultado via RPC get_table_count)</em></p>
<p><em>Total de functions SQL: <strong>${stats.totalFunctions}</strong> (consultado via RPC get_function_count)</em></p>
<p><em>Tamanho do banco: <strong>${stats.databaseSize}</strong> (consultado via RPC get_database_statistics)</em></p>

<h3>Tabelas por Módulo</h3>
${MODULES.map(m => `
<div style="margin-bottom: 8px;">
  <strong>${m.name}:</strong> ${m.tables.map(t => `<span class="tag">${t}</span>`).join(' ')}
</div>
`).join('')}

<h2>6. Edge Functions (${EDGE_FUNCTIONS.length})</h2>
<table>
  <tr><th>#</th><th>Nome</th><th>Categoria</th></tr>
  ${EDGE_FUNCTIONS.map((f, i) => `<tr><td>${i + 1}</td><td><code>${f}</code></td><td>${getEdgeFunctionCategory(f)}</td></tr>`).join('')}
</table>

<h2>7. Planos & Permissões</h2>
<table>
  <tr><th>Plano</th><th>Funcionalidades</th></tr>
  <tr><td><strong>Teste Grátis (7 dias)</strong></td><td>Acesso PRO completo durante o período de teste</td></tr>
  <tr><td><strong>Essencial</strong></td><td>PDV/Caixa, Materiais, Despesas, Adições de Caixa, Configurações, Ajuda, Indicações</td></tr>
  <tr><td><strong>PRO</strong></td><td>Tudo do Essencial + Dashboard, Estoque, Compras, Vendas, Transações, Fluxo de Caixa, Clientes, Funcionários</td></tr>
</table>
<h3>Papéis Administrativos (RBAC)</h3>
<table>
  <tr><th>Papel</th><th>Permissões</th></tr>
  <tr><td>Admin Master</td><td>Acesso total ao sistema, segurança, configurações críticas</td></tr>
  <tr><td>Admin Operacional</td><td>Conteúdo, financeiro, gestão de usuários</td></tr>
  <tr><td>Suporte</td><td>Visualização de usuários, resposta a erros</td></tr>
  <tr><td>Leitura</td><td>Apenas visualização do dashboard</td></tr>
</table>

<h2>8. Segurança & Infraestrutura</h2>
<ul>
  <li><strong>Autenticação:</strong> Supabase Auth com email/senha, confirmação por email</li>
  <li><strong>RLS (Row Level Security):</strong> Ativo em todas as tabelas com políticas por user_id</li>
  <li><strong>Rate Limiting:</strong> Proteção contra brute force via Edge Function</li>
  <li><strong>Bloqueio IP:</strong> Sistema de bloqueio automático e manual</li>
  <li><strong>Audit Logs:</strong> Registro de todas as ações administrativas</li>
  <li><strong>Access Logs:</strong> Log de acessos ao painel admin com IP, browser, OS</li>
  <li><strong>Sessões Ativas:</strong> Monitoramento de sessões em tempo real</li>
  <li><strong>CSP:</strong> Content Security Policy configurada</li>
  <li><strong>RBAC:</strong> 4 níveis de permissão administrativa</li>
  <li><strong>PWA:</strong> Service Worker com cache estratégico</li>
  <li><strong>Safe Area:</strong> Suporte a notch/ilha dinâmica em dispositivos móveis</li>
</ul>

<h2>9. Integrações Externas</h2>
<table>
  <tr><th>Serviço</th><th>Uso</th></tr>
  <tr><td>Supabase</td><td>Backend completo (Auth, DB, Storage, Functions, Realtime)</td></tr>
  <tr><td>Mercado Pago</td><td>Pagamentos PIX e Cartão de Crédito</td></tr>
  <tr><td>Google Gemini</td><td>Geração de artigos SEO, imagens, transcrição de áudio</td></tr>
  <tr><td>Telegram Bot API</td><td>Cadastro de produtos via foto</td></tr>
  <tr><td>Pinterest API</td><td>Publicação automática de pins</td></tr>
</table>

<h2>10. Stack Tecnológica</h2>
<table>
  <tr><th>Categoria</th><th>Pacotes</th></tr>
  <tr><td>Core</td><td>React 18, TypeScript 5, Vite 5</td></tr>
  <tr><td>UI</td><td>Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, Lucide Icons</td></tr>
  <tr><td>Estado</td><td>TanStack React Query, React Hook Form, Zod</td></tr>
  <tr><td>Roteamento</td><td>React Router DOM v6</td></tr>
  <tr><td>Gráficos</td><td>Recharts</td></tr>
  <tr><td>Datas</td><td>date-fns</td></tr>
  <tr><td>SEO</td><td>React Helmet Async</td></tr>
  <tr><td>PWA</td><td>vite-plugin-pwa</td></tr>
  <tr><td>Drag & Drop</td><td>@dnd-kit</td></tr>
  <tr><td>Testes</td><td>Vitest, Testing Library</td></tr>
  <tr><td>Markdown</td><td>marked, DOMPurify</td></tr>
  <tr><td>PDF</td><td>html2pdf.js</td></tr>
</table>

<div class="footer">
  <p>XLata — Documentação Técnica Completa | Gerado em ${stats.generatedAt} | Versão ${stats.systemVersion}</p>
  <p>Todos os dados estatísticos foram consultados em tempo real no momento da geração deste documento.</p>
  <p>Banco de dados: ${stats.databaseSize} | ${stats.totalTableCount} tabelas | ${stats.totalFunctions} functions SQL</p>
</div>

</body>
</html>`;
}

export const ProjectDocumentation: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadPreviewStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await fetchLiveStats();
      setLiveStats(stats);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadPreviewStats();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      toast({ title: '📄 Gerando documentação...', description: 'Consultando banco de dados em tempo real...' });
      
      // Always fetch fresh data at generation time
      const stats = await fetchLiveStats();
      setLiveStats(stats);
      const html = buildDocumentHTML(stats);
      
      const { loadHtml2Pdf } = await import('@/utils/optimizedImports');
      const html2pdf = await loadHtml2Pdf();

      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `XLata_Documentacao_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
      
      toast({ title: '✅ Documentação gerada!', description: 'PDF gerado com dados em tempo real e baixado com sucesso.' });
    } catch (err) {
      console.error('Erro ao gerar documentação:', err);
      toast({ title: '❌ Erro', description: 'Falha ao gerar documentação.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentação do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Gere a documentação técnica completa do sistema XLata em PDF. Todos os dados são consultados em <strong>tempo real</strong> no banco de dados no momento da geração — usuários, pedidos, materiais, tabelas, functions e mais.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.totalUsers.toLocaleString('pt-BR') ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Usuários</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.totalTableCount ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Tabelas (real)</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.totalFunctions ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Functions SQL</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.databaseSize ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Tamanho DB</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.totalOrders.toLocaleString('pt-BR') ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Pedidos</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {loadingStats ? '...' : liveStats?.totalBlogPosts ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">Posts Blog</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{EDGE_FUNCTIONS.length}</div>
              <div className="text-xs text-muted-foreground">Edge Functions</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{APP_ROUTES.length}</div>
              <div className="text-xs text-muted-foreground">Rotas</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPreviewStats}
              disabled={loadingStats}
            >
              <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
              Atualizar dados
            </Button>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Consultando banco e gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Gerar & Baixar Documentação PDF (Dados em Tempo Real)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
