import { motion } from 'framer-motion';

export function ReceiptMockup() {
  return (
    <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-[290px] md:max-w-[380px] shadow-xl border border-slate-200 origin-top">
      <div className="text-center border-b border-dashed border-slate-300 pb-2 md:pb-3 mb-2 md:mb-3">
        {/* Logo oficial XLata em monocromático preto */}
        <img 
          src="/lovable-uploads/XLATALOGO.png" 
          alt="XLata" 
          className="mx-auto mb-1 md:mb-1.5 h-10 md:h-14 w-auto brightness-0"
        />
        <p className="text-slate-900 font-bold text-xs md:text-sm">COMPROVANTE</p>
        <p className="text-slate-400 text-[8px] md:text-[10px]">XLata • Depósito de Recicláveis</p>
        <p className="text-slate-400 text-[8px] md:text-[10px]">24/03/2026 — 14:32</p>
      </div>
      <div className="space-y-1.5 md:space-y-2.5 mb-2 md:mb-3 border-b border-dashed border-slate-300 pb-2 md:pb-3">
        <motion.div className="flex justify-between text-[10px] md:text-xs" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
          <div>
            <p className="text-slate-800 font-medium">Alumínio</p>
            <p className="text-slate-400 text-[8px] md:text-[10px]">68,200 kg × R$ 6.50</p>
          </div>
          <span className="text-slate-900 font-semibold">R$ 443.30</span>
        </motion.div>
        <motion.div className="flex justify-between text-[10px] md:text-xs" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.45 }}>
          <div>
            <p className="text-slate-800 font-medium">Cobre</p>
            <p className="text-slate-400 text-[8px] md:text-[10px]">12,500 kg × R$ 42.00</p>
          </div>
          <span className="text-slate-900 font-semibold">R$ 525.00</span>
        </motion.div>
      </div>
      <motion.div className="flex justify-between items-center mb-2 md:mb-3" initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, type: 'spring' }}>
        <span className="text-slate-600 font-semibold text-[10px] md:text-xs">TOTAL</span>
        <span className="text-emerald-600 font-bold text-sm md:text-lg">R$ 968.30</span>
      </motion.div>
      <div className="bg-slate-50 rounded-md p-1.5 md:p-2.5 mb-2 md:mb-3 text-center">
        <p className="text-slate-400 text-[8px] md:text-[10px]">Pagamento</p>
        <p className="text-slate-700 font-semibold text-[10px] md:text-xs">💵 Dinheiro</p>
      </div>
      <motion.div className="bg-emerald-500 rounded-md py-1.5 md:py-2.5 text-center text-white font-semibold text-[10px] md:text-sm cursor-default flex items-center justify-center gap-1" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }}>
        🖨️ Imprimir
      </motion.div>
    </div>
  );
}
