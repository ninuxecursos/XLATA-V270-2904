import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2, FileText, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Material {
  name: string;
  price: number;
  salePrice: number;
  unit: string;
  previousPrice?: number | null;
  previousSalePrice?: number | null;
}

interface SystemSettings {
  logo: string | null;
  whatsapp1: string | null;
  whatsapp2: string | null;
  address: string | null;
  company: string | null;
}

interface MaterialsPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaleMode: boolean;
}

// Carrega imagem como dataURL para inclusão no PDF
const loadImageAsDataURL = (url: string): Promise<{ dataUrl: string; w: number; h: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

export function MaterialsPdfModal({ isOpen, onClose, isSaleMode }: MaterialsPdfModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('tabela-precos.pdf');
  const generatedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      generatedRef.current = false;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfBlob(null);
      setPdfUrl(null);
      setLoading(true);
      return;
    }
    if (generatedRef.current || !user?.id) return;
    generatedRef.current = true;

    (async () => {
      try {
        setLoading(true);

        const [{ data: materialsData }, { data: settingsData }] = await Promise.all([
          supabase
            .from('materials')
            .select('name, price, sale_price, unit, previous_price, previous_sale_price')
            .eq('user_id', user.id)
            .order('name'),
          supabase
            .from('system_settings')
            .select('logo, whatsapp1, whatsapp2, address, company')
            .eq('user_id', user.id)
            .single(),
        ]);

        const materials: Material[] = (materialsData || []).map((m: any) => ({
          name: m.name,
          price: Number(m.price) || 0,
          salePrice: Number(m.sale_price) || 0,
          unit: m.unit,
          previousPrice: m.previous_price != null ? Number(m.previous_price) : null,
          previousSalePrice: m.previous_sale_price != null ? Number(m.previous_sale_price) : null,
        }));

        const settings: SystemSettings = settingsData || { logo: null, whatsapp1: null, whatsapp2: null, address: null, company: null };

        setGenerating(true);
        const { blob, name } = await buildPdf(materials, settings, isSaleMode);
        setPdfBlob(blob);
        setPdfUrl(URL.createObjectURL(blob));
        setFilename(name);
      } catch (e) {
        console.error('Erro ao gerar PDF:', e);
        toast.error('Erro ao gerar PDF');
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    })();
  }, [isOpen, user?.id, isSaleMode]);

  const buildPdf = async (materials: Material[], settings: SystemSettings, saleMode: boolean) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const now = new Date();
    const dateStr = formatDate(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const dateFile = formatDate(now, 'yyyy-MM-dd-HHmm');
    const tipo = saleMode ? 'venda' : 'compra';
    const filename = `tabela-precos-${tipo}-${dateFile}.pdf`;

    // ========= HEADER =========
    const headerH = 32;
    doc.setFillColor(11, 18, 32); // #0b1220
    doc.rect(0, 0, pageWidth, headerH, 'F');
    // accent line
    doc.setFillColor(34, 197, 94); // #22c55e
    doc.rect(0, headerH, pageWidth, 1.2, 'F');

    // Logo
    let textStartX = 14;
    if (settings.logo) {
      const img = await loadImageAsDataURL(settings.logo);
      if (img) {
        const maxH = 22;
        const maxW = 32;
        const ratio = img.w / img.h;
        let w = maxW;
        let h = w / ratio;
        if (h > maxH) {
          h = maxH;
          w = h * ratio;
        }
        try {
          doc.addImage(img.dataUrl, 'PNG', 14, (headerH - h) / 2, w, h);
          textStartX = 14 + w + 6;
        } catch {
          /* ignore */
        }
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(settings.company || 'Empresa', textStartX, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    const phones = [settings.whatsapp1, settings.whatsapp2].filter(Boolean).join('  ·  ');
    if (phones) doc.text(phones, textStartX, 19);
    if (settings.address) {
      const addrLines = doc.splitTextToSize(settings.address, pageWidth - textStartX - 14);
      doc.text(addrLines, textStartX, 25);
    }

    // ========= TÍTULO =========
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const title = `TABELA DE PREÇOS — ${saleMode ? 'VENDA' : 'COMPRA'}`;
    doc.text(title, pageWidth / 2, headerH + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerada em ${dateStr}`, pageWidth / 2, headerH + 16, { align: 'center' });

    // ========= TABELA =========
    const rows = materials.map((m) => {
      const price = saleMode ? m.salePrice : m.price;
      const prev = saleMode ? m.previousSalePrice : m.previousPrice;
      let trend = '—';
      if (prev != null) {
        if (price > prev) trend = '▲';
        else if (price < prev) trend = '▼';
        else trend = '=';
      }
      return [m.name, m.unit || 'kg', `R$ ${price.toFixed(2)}`, trend];
    });

    autoTable(doc, {
      startY: headerH + 22,
      head: [['Material', 'Unidade', 'Preço', 'Var.']],
      body: rows,
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, textColor: [30, 41, 59] },
      headStyles: { fillColor: [11, 18, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 14, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const v = data.cell.raw;
          if (v === '▲') data.cell.styles.textColor = [220, 38, 38];
          else if (v === '▼') data.cell.styles.textColor = [22, 163, 74];
          else data.cell.styles.textColor = [148, 163, 184];
        }
      },
      margin: { left: 14, right: 14, bottom: 22 },
    });

    // Total + Footer em todas as páginas
    const total = `Total de materiais: ${materials.length}`;
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.6);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(total, 14, pageHeight - 10);
      doc.text('Powered by XLATA · xlata.site', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    const blob = doc.output('blob');
    return { blob, name: filename };
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const a = document.createElement('a');
    a.href = pdfUrl!;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShareWhatsApp = async () => {
    if (!pdfBlob) return;
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    // @ts-ignore - canShare with files é parte da Web Share API Level 2
    const canShareFile = navigator.canShare && navigator.canShare({ files: [file] });

    if (canShareFile && navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Tabela de Preços',
          text: 'Confira nossa tabela de preços atualizada.',
        });
        return;
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn('share falhou', e);
      }
    }

    // Fallback: baixar e abrir WhatsApp Web
    handleDownload();
    const msg = encodeURIComponent('Olá! Segue em anexo nossa tabela de preços atualizada.');
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    toast.info('PDF baixado. Anexe-o manualmente no WhatsApp.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-emerald-400" />
            Tabela de Preços — PDF Profissional
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          {(loading || generating) && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm">{generating ? 'Montando PDF…' : 'Carregando dados…'}</span>
            </div>
          )}
          {!loading && !generating && pdfUrl && (
            <iframe title="Preview PDF" src={pdfUrl} className="w-full h-full" />
          )}
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-slate-600 text-white hover:bg-slate-800 sm:flex-1"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!pdfBlob}
            className="bg-slate-700 hover:bg-slate-600 text-white sm:flex-1"
          >
            <Download className="w-4 h-4 mr-2" /> Baixar PDF
          </Button>
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={!pdfBlob}
            className="bg-emerald-600 hover:bg-emerald-700 text-white sm:flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Enviar via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MaterialsPdfModal;
