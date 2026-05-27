/**
 * Otimização de imports de bibliotecas pesadas
 * Importa apenas os componentes necessários para reduzir bundle size
 */

// Recharts - importar apenas componentes necessários
export {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Date-fns - importar apenas funções utilizadas
export {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  addDays,
  differenceInDays,
} from 'date-fns';

export { ptBR } from 'date-fns/locale';

// Lazy load html2pdf apenas quando necessário
export const loadHtml2Pdf = async () => {
  const html2pdf = await import('html2pdf.js');
  return html2pdf.default;
};

// Lazy load DOMPurify apenas quando necessário
export const loadDOMPurify = async () => {
  const DOMPurify = await import('dompurify');
  return DOMPurify.default;
};
