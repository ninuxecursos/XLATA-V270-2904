import { describe, it, expect } from 'vitest';
import { validators } from './validators';

describe('validators', () => {
  describe('uuid', () => {
    it('deve validar UUIDs válidos', () => {
      expect(validators.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validators.uuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('deve rejeitar UUIDs inválidos', () => {
      expect(validators.uuid('not-a-uuid')).toBe(false);
      expect(validators.uuid('123')).toBe(false);
      expect(validators.uuid('')).toBe(false);
    });
  });

  describe('email', () => {
    it('deve validar emails válidos', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('user.name@domain.co.uk')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validators.email('not-an-email')).toBe(false);
      expect(validators.email('@example.com')).toBe(false);
      expect(validators.email('test@')).toBe(false);
    });
  });

  describe('phone', () => {
    it('deve validar telefones válidos', () => {
      expect(validators.phone('11987654321')).toBe(true);
      expect(validators.phone('1134567890')).toBe(true);
      expect(validators.phone('(11) 98765-4321')).toBe(true);
    });

    it('deve rejeitar telefones inválidos', () => {
      expect(validators.phone('123')).toBe(false);
      expect(validators.phone('abc')).toBe(false);
    });
  });

  describe('cpf', () => {
    it('deve validar CPF válido', () => {
      expect(validators.cpf('111.444.777-35')).toBe(true);
      expect(validators.cpf('11144477735')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validators.cpf('111.444.777-36')).toBe(false);
      expect(validators.cpf('11111111111')).toBe(false);
      expect(validators.cpf('123')).toBe(false);
    });
  });

  describe('currency', () => {
    it('deve validar valores monetários válidos', () => {
      expect(validators.currency(0)).toBe(true);
      expect(validators.currency(100.50)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(validators.currency(-10)).toBe(false);
      expect(validators.currency(NaN)).toBe(false);
      expect(validators.currency('100')).toBe(false);
    });
  });

  describe('weight', () => {
    it('deve validar pesos válidos', () => {
      expect(validators.weight(10.5)).toBe(true);
      expect(validators.weight(0.001)).toBe(true);
    });

    it('deve rejeitar pesos inválidos', () => {
      expect(validators.weight(0)).toBe(false);
      expect(validators.weight(-10)).toBe(false);
      expect(validators.weight(NaN)).toBe(false);
    });
  });

  describe('notEmpty', () => {
    it('deve validar strings não vazias', () => {
      expect(validators.notEmpty('hello')).toBe(true);
      expect(validators.notEmpty(' test ')).toBe(true);
    });

    it('deve rejeitar strings vazias', () => {
      expect(validators.notEmpty('')).toBe(false);
      expect(validators.notEmpty('   ')).toBe(false);
    });
  });

  describe('lengthRange', () => {
    it('deve validar comprimento dentro do intervalo', () => {
      expect(validators.lengthRange('hello', 1, 10)).toBe(true);
      expect(validators.lengthRange('test', 4, 4)).toBe(true);
    });

    it('deve rejeitar comprimento fora do intervalo', () => {
      expect(validators.lengthRange('hi', 3, 10)).toBe(false);
      expect(validators.lengthRange('very long text', 1, 5)).toBe(false);
    });
  });
});
