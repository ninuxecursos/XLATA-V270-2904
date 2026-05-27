/**
 * Gerador do PDF profissional do Guia do CMS Blog.
 * Usa a fonte única de verdade em guideContent.ts
 */
import jsPDF from 'jspdf';
import { GUIDE_GROUPS, GUIDE_SECTIONS, GuideSection } from './guideContent';

type Ctx = {
  doc: jsPDF;
  y: number;
  page: number;
  margin: number;
  pageW: number;
  pageH: number;
  contentW: number;
};

const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // emerald-500
  ink: [17, 24, 39] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  soft: [243, 244, 246] as [number, number, number],
  accent: [56, 189, 248] as [number, number, number], // sky
  warn: [245, 158, 11] as [number, number, number],
  danger: [244, 63, 94] as [number, number, number],
};

const LINE_HEIGHT = 5.2;

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin - 12) {
    addFooter(ctx);
    ctx.doc.addPage();
    ctx.page += 1;
    ctx.y = ctx.margin;
    addHeader(ctx);
  }
}

function addHeader(ctx: Ctx) {
  const { doc, margin, pageW } = ctx;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GUIA DO CMS BLOG • COVILDOMAL', margin, 6.6);
  doc.setFont('helvetica', 'normal');
  doc.text('Manual oficial de uso', pageW - margin, 6.6, { align: 'right' });
  ctx.y = margin + 4;
}

function addFooter(ctx: Ctx) {
  const { doc, margin, pageW, pageH, page } = ctx;
  doc.setDrawColor(...COLORS.soft);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.text('Covildomal • Documentação interna', margin, pageH - 6);
  doc.text(`Página ${page}`, pageW - margin, pageH - 6, { align: 'right' });
}

function writeWrapped(
  ctx: Ctx,
  text: string,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {}
) {
  const { doc, margin, contentW } = ctx;
  const size = opts.size ?? 10;
  const indent = opts.indent ?? 0;
  doc.setFontSize(size);
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setTextColor(...(opts.color ?? COLORS.ink));
  const lines = doc.splitTextToSize(text, contentW - indent);
  for (const ln of lines) {
    ensureSpace(ctx, LINE_HEIGHT);
    doc.text(ln, margin + indent, ctx.y);
    ctx.y += size * 0.45 + 2;
  }
}

function sectionTitle(ctx: Ctx, label: string, color: [number, number, number]) {
  const { doc, margin, contentW } = ctx;
  ensureSpace(ctx, 12);
  doc.setFillColor(...color);
  doc.rect(margin, ctx.y - 3.5, 2.4, 5.2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.ink);
  doc.text(label, margin + 5, ctx.y);
  ctx.y += 7;
}

function softBox(ctx: Ctx, drawer: () => void, tone: 'soft' | 'tip' | 'warn' = 'soft') {
  // simply add a left border on each line via section
  drawer();
}

function renderCover(ctx: Ctx) {
  const { doc, pageW, pageH, margin } = ctx;
  // banner
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Guia do CMS Blog', margin, 38);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Manual oficial de funcionalidades — Covildomal', margin, 50);

  ctx.y = 90;
  doc.setTextColor(...COLORS.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('O que você vai encontrar neste manual', margin, ctx.y);
  ctx.y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  const intro =
    'Este documento descreve, de forma profissional, todas as funcionalidades do CMS do Blog. ' +
    'Cada seção segue o mesmo padrão: o que faz, quando usar, passo a passo, dicas e atenção. ' +
    'Use-o como referência rápida no dia a dia ou para treinar novos operadores.';
  const lines = doc.splitTextToSize(intro, ctx.contentW);
  doc.text(lines, margin, ctx.y);
  ctx.y += lines.length * 5.5 + 8;

  // blocos com grupos
  GUIDE_GROUPS.forEach((g) => {
    ensureSpace(ctx, 22);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, ctx.y, ctx.contentW, 18, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(g.title.toUpperCase(), margin + 4, ctx.y + 6);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    const desc = doc.splitTextToSize(g.description, ctx.contentW - 8);
    doc.text(desc, margin + 4, ctx.y + 11);
    ctx.y += 22;
  });
}

function renderTOC(ctx: Ctx) {
  const { doc, margin } = ctx;
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = ctx.margin;
  addHeader(ctx);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.ink);
  doc.text('Sumário', margin, ctx.y + 6);
  ctx.y += 14;

  GUIDE_GROUPS.forEach((g) => {
    const sections = GUIDE_SECTIONS.filter((s) => s.group === g.id);
    if (sections.length === 0) return;
    ensureSpace(ctx, 14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(g.title, margin, ctx.y);
    ctx.y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink);
    sections.forEach((s) => {
      ensureSpace(ctx, 6);
      doc.text(`• ${s.label}`, margin + 4, ctx.y);
      doc.setTextColor(...COLORS.muted);
      doc.text(s.tagline, margin + 50, ctx.y);
      doc.setTextColor(...COLORS.ink);
      ctx.y += 5.5;
    });
    ctx.y += 4;
  });
}

function renderSection(ctx: Ctx, s: GuideSection, index: number) {
  const { doc, margin } = ctx;
  ctx.doc.addPage();
  ctx.page += 1;
  ctx.y = ctx.margin;
  addHeader(ctx);

  // Group label
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  const groupTitle = GUIDE_GROUPS.find((g) => g.id === s.group)?.title ?? '';
  doc.text(groupTitle.toUpperCase(), margin, ctx.y + 4);
  ctx.y += 8;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.ink);
  const titleLines = doc.splitTextToSize(`${index}. ${s.title}`, ctx.contentW);
  doc.text(titleLines, margin, ctx.y + 4);
  ctx.y += titleLines.length * 8 + 2;

  // Tagline
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  const tagLines = doc.splitTextToSize(s.tagline, ctx.contentW);
  doc.text(tagLines, margin, ctx.y);
  ctx.y += tagLines.length * 5.5 + 6;

  // Divider
  doc.setDrawColor(...COLORS.soft);
  doc.line(margin, ctx.y, ctx.pageW - margin, ctx.y);
  ctx.y += 6;

  sectionTitle(ctx, 'O QUE FAZ', COLORS.primary);
  writeWrapped(ctx, s.whatItDoes, { size: 10.5 });
  ctx.y += 3;

  sectionTitle(ctx, 'QUANDO USAR', COLORS.accent);
  writeWrapped(ctx, s.whenToUse, { size: 10.5 });
  ctx.y += 3;

  sectionTitle(ctx, 'PASSO A PASSO', COLORS.primary);
  s.steps.forEach((step, i) => {
    ensureSpace(ctx, 14);
    // number bullet
    doc.setFillColor(...COLORS.primary);
    doc.circle(margin + 3, ctx.y - 1, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(i + 1), margin + 3, ctx.y + 0.6, { align: 'center' });

    doc.setTextColor(...COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(step.title, margin + 9, ctx.y);
    ctx.y += 5;
    writeWrapped(ctx, step.detail, { size: 10, color: COLORS.muted, indent: 9 });
    ctx.y += 2;
  });

  if (s.tips && s.tips.length > 0) {
    ctx.y += 2;
    sectionTitle(ctx, 'DICAS', COLORS.warn);
    s.tips.forEach((t) => {
      ensureSpace(ctx, 6);
      writeWrapped(ctx, `• ${t}`, { size: 10, indent: 2 });
    });
  }

  if (s.warnings && s.warnings.length > 0) {
    ctx.y += 2;
    sectionTitle(ctx, 'ATENÇÃO', COLORS.danger);
    s.warnings.forEach((w) => {
      ensureSpace(ctx, 6);
      writeWrapped(ctx, `• ${w}`, { size: 10, indent: 2, color: COLORS.danger });
    });
  }
}

export function generateGuidePdf(): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const ctx: Ctx = {
    doc,
    y: margin,
    page: 1,
    margin,
    pageW,
    pageH,
    contentW: pageW - margin * 2,
  };

  renderCover(ctx);
  addFooter(ctx);

  renderTOC(ctx);
  addFooter(ctx);

  GUIDE_SECTIONS.forEach((s, i) => {
    renderSection(ctx, s, i + 1);
    addFooter(ctx);
  });

  return doc;
}

export function downloadGuidePdf() {
  const doc = generateGuidePdf();
  const date = new Date().toISOString().split('T')[0];
  doc.save(`guia-cms-blog-covildomal-${date}.pdf`);
}
