import { motion } from 'framer-motion';

export function CalculationMockup() {
  return (
    <div className="bg-slate-900 rounded-xl p-4 md:p-5 w-full max-w-[290px] md:max-w-[380px] border border-slate-700/60 shadow-xl origin-top">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h4 className="text-white font-bold text-xs md:text-base">Alumínio</h4>
        <div className="w-4 h-4 md:w-5 md:h-5 bg-red-500/80 rounded-full flex items-center justify-center">
          <span className="text-white text-[8px] md:text-[10px] font-bold">✕</span>
        </div>
      </div>
      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
        <div className="flex justify-between text-[11px] md:text-sm">
          <span className="text-slate-400">Valor por kg:</span>
          <motion.span className="text-emerald-400 font-semibold" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            R$ 6.50
          </motion.span>
        </div>
        <div className="flex justify-between text-[11px] md:text-sm">
          <span className="text-slate-400">Peso bruto:</span>
          <span className="text-white font-semibold">68,200/kg</span>
        </div>
      </div>
      <motion.div
        className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-2.5 md:p-3 mb-3 md:mb-4 flex items-center gap-2"
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <span className="bg-emerald-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded">TOTAL</span>
        <span className="text-emerald-400 font-bold text-base md:text-xl">R$ 443.30</span>
      </motion.div>
      <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
        <div className="border border-slate-600 rounded-md py-1 md:py-2 text-center text-slate-300 text-[9px] md:text-xs font-medium cursor-default">Add Tara</div>
        <div className="border border-slate-600 rounded-md py-1 md:py-2 text-center text-slate-300 text-[9px] md:text-xs font-medium cursor-default">Add Diferença</div>
      </div>
      <motion.div className="bg-emerald-500 rounded-lg py-1.5 md:py-2.5 text-center text-white font-semibold text-[11px] md:text-sm cursor-default" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}>
        Adicionar
      </motion.div>
      <div className="border border-slate-600 rounded-lg py-1.5 md:py-2.5 mt-1.5 md:mt-2 text-center text-slate-300 text-[11px] md:text-sm cursor-default">Cancelar</div>
    </div>
  );
}
