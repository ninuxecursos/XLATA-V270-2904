import { z } from 'zod';

export const checkoutFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = val.replace(/\D/g, '');
      return clean.length >= 10 && clean.length <= 11;
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  
  cpf: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = val.replace(/\D/g, '');
      return clean.length === 11;
    }, 'CPF deve ter 11 dígitos'),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Validação de CPF (algoritmo completo)
export function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

// Máscaras de formatação
export function formatPhone(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function formatCPF(value: string): string {
  const clean = value.replace(/\D/g, '');
  return clean
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCEP(value: string): string {
  const clean = value.replace(/\D/g, '');
  return clean.replace(/(\d{5})(\d{0,3})/, '$1-$2');
}
