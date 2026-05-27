import { describe, it, expect } from 'vitest';
import { formatters } from './formatters';

describe('formatters', () => {
  describe('currency', () => {
    it('deve formatar valores em reais', () => {
      expect(formatters.currency(1500.50)).toBe('R$ 1.500,50');
      expect(formatters.currency(0)).toBe('R$ 0,00');
      expect(formatters.currency(100)).toBe('R$ 100,00');
    });

    it('deve formatar valores negativos', () => {
      expect(formatters.currency(-100)).toBe('-R$ 100,00');
    });
  });

  describe('weight', () => {
    it('deve formatar peso em kg com 3 casas decimais por padrão', () => {
      expect(formatters.weight(10.123)).toBe('10.123 kg');
      expect(formatters.weight(0.5)).toBe('0.500 kg');
    });

    it('deve respeitar o número de casas decimais fornecido', () => {
      expect(formatters.weight(10.12345, 2)).toBe('10.12 kg');
      expect(formatters.weight(10.12345, 5)).toBe('10.12345 kg');
    });
  });

  describe('isValidUUID', () => {
    it('deve validar UUIDs corretos', () => {
      expect(formatters.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(formatters.isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('deve rejeitar UUIDs inválidos', () => {
      expect(formatters.isValidUUID('not-a-uuid')).toBe(false);
      expect(formatters.isValidUUID('123')).toBe(false);
      expect(formatters.isValidUUID('')).toBe(false);
      expect(formatters.isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });
  });

  describe('phone', () => {
    it('deve formatar celular com 11 dígitos', () => {
      expect(formatters.phone('11987654321')).toBe('(11) 98765-4321');
    });

    it('deve formatar telefone fixo com 10 dígitos', () => {
      expect(formatters.phone('1134567890')).toBe('(11) 3456-7890');
    });

    it('deve retornar entrada inválida sem alteração', () => {
      expect(formatters.phone('123')).toBe('123');
      expect(formatters.phone('abc')).toBe('abc');
    });
  });

  describe('truncate', () => {
    it('deve truncar texto longo', () => {
      expect(formatters.truncate('Este é um texto muito longo', 10)).toBe('Este é...');
    });

    it('não deve truncar texto curto', () => {
      expect(formatters.truncate('Curto', 10)).toBe('Curto');
      expect(formatters.truncate('Texto', 5)).toBe('Texto');
    });

    it('deve retornar string vazia para entrada vazia', () => {
      expect(formatters.truncate('', 10)).toBe('');
    });
  });

  describe('date', () => {
    it('deve formatar timestamp em data pt-BR', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime();
      expect(formatters.date(timestamp)).toBe('15/01/2024');
    });
  });

  describe('datetime', () => {
    it('deve formatar timestamp em data e hora pt-BR', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime();
      expect(formatters.datetime(timestamp)).toBe('15/01/2024 10:30');
    });
  });

  describe('percentage', () => {
    it('deve formatar porcentagem', () => {
      expect(formatters.percentage(0.1234)).toBe('12,34%');
      expect(formatters.percentage(1)).toBe('100,00%');
      expect(formatters.percentage(0)).toBe('0,00%');
    });

    it('deve respeitar casas decimais customizadas', () => {
      expect(formatters.percentage(0.1234, 0)).toBe('12%');
      expect(formatters.percentage(0.1234, 1)).toBe('12,3%');
    });
  });
});
