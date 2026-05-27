import { motion } from 'framer-motion';

const materials = [
  { name: 'ACM', price: '0.30' },
  { name: 'Alum Chap', price: '7.00' },
  { name: 'Alum Perfil', price: '8.00' },
  { name: 'Bateria', price: '2.00' },
  { name: 'Bloco Limpo', price: '3.00' },
  { name: 'Cobre 1', price: '40.00' },
  { name: 'Ferro', price: '0.50' },
  { name: 'Inox 304', price: '3.00' },
  { name: 'Latinha', price: '9.00' },
];

export function ScaleKeypadMockup() {
  const keys = ['1','2','3','4','5','6','7','8','9','0'];

  return (
    <div className="flex items-start">
      {/* Scale Keypad */}
      <div className="bg-slate-900 rounded-xl p-3 md:p-4 w-[200px] md:w-[280px] border border-slate-700/60 shadow-xl shrink-0 z-10">
        <div className="bg-slate-950 rounded-lg p-2 md:p-3 mb-2 md:mb-3 border border-slate-700/40">
          <p className="text-[8px] md:text-xs text-slate-500 mb-0.5 font-medium">Peso (kg)</p>
          <motion.p
            className="text-lg md:text-2xl font-bold text-emerald-400 font-mono tracking-wider text-right"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            68,200
          </motion.p>
        </div>
        <div className="grid grid-cols-3 gap-1 md:gap-1.5 mb-1 md:mb-2">
          {keys.map((key) => (
            <div
              key={key}
              className={`${key === '0' ? 'col-span-2' : ''} bg-slate-800 rounded md:rounded-md py-1.5 md:py-2.5 text-center text-white font-semibold text-[10px] md:text-sm border border-slate-700/50 cursor-default select-none`}
            >
              {key}
            </div>
          ))}
          <div className="bg-red-500/80 rounded md:rounded-md py-1.5 md:py-2.5 text-center text-white font-bold text-[10px] md:text-sm cursor-default select-none">C</div>
        </div>
        <div className="bg-amber-600/80 rounded md:rounded-md py-1 md:py-2 text-center text-white font-semibold text-[8px] md:text-xs cursor-default select-none">
          ZERAR BALANÇA
        </div>
      </div>

      {/* Materials Grid */}
      <motion.div
        className="bg-slate-800/95 backdrop-blur rounded-xl p-2.5 md:p-3 w-[200px] md:w-[260px] border border-slate-700/60 shadow-xl -ml-10 md:-ml-12 mt-4 z-20"
        initial={{ opacity: 0, x: 15 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <p className="text-[7px] md:text-[10px] text-slate-400 font-medium">Modo Compra</p>
          <p className="text-[7px] md:text-[10px] text-slate-500">{materials.length} itens</p>
        </div>
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {materials.map((mat, i) => (
            <motion.div
              key={mat.name}
              className="bg-emerald-600/80 border border-emerald-500/40 rounded md:rounded-md py-1 md:py-1.5 px-0.5 md:px-1 text-center cursor-default select-none"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.12, delay: 0.6 + i * 0.03 }}
            >
              <p className="text-white font-bold text-[6px] md:text-[9px] leading-tight truncate">{mat.name}</p>
              <p className="text-emerald-200 text-[5px] md:text-[8px]">R$ {mat.price}</p>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-around mt-1 md:mt-2 pt-1 md:pt-2 border-t border-slate-700/50">
          {['⚖️ Balança', '📦 Materiais', '🛒 Pedidos'].map((item) => (
            <span key={item} className={`text-[6px] md:text-[9px] ${item.includes('Materiais') ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
              {item}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
