import { describe, it, expect } from 'vitest';
import { getPaginationParams, getPaginationOffset, buildPaginatedResult } from './queryHelpers';

describe('queryHelpers', () => {
  describe('getPaginationParams', () => {
    it('deve retornar valores padrão quando não há parâmetros', () => {
      const params = new URLSearchParams();
      const result = getPaginationParams(params);
      
      expect(result).toEqual({ page: 1, pageSize: 50 });
    });

    it('deve limitar pageSize entre 10 e 100', () => {
      const params1 = new URLSearchParams('?pageSize=5');
      expect(getPaginationParams(params1).pageSize).toBe(10);

      const params2 = new URLSearchParams('?pageSize=200');
      expect(getPaginationParams(params2).pageSize).toBe(100);

      const params3 = new URLSearchParams('?pageSize=50');
      expect(getPaginationParams(params3).pageSize).toBe(50);
    });

    it('deve garantir que page seja no mínimo 1', () => {
      const params1 = new URLSearchParams('?page=0');
      expect(getPaginationParams(params1).page).toBe(1);

      const params2 = new URLSearchParams('?page=-5');
      expect(getPaginationParams(params2).page).toBe(1);

      const params3 = new URLSearchParams('?page=3');
      expect(getPaginationParams(params3).page).toBe(3);
    });

    it('deve parsear valores numéricos corretamente', () => {
      const params = new URLSearchParams('?page=2&pageSize=25');
      const result = getPaginationParams(params);
      
      expect(result).toEqual({ page: 2, pageSize: 25 });
    });
  });

  describe('getPaginationOffset', () => {
    it('deve calcular offset corretamente', () => {
      expect(getPaginationOffset(1, 50)).toBe(0);
      expect(getPaginationOffset(2, 50)).toBe(50);
      expect(getPaginationOffset(3, 25)).toBe(50);
      expect(getPaginationOffset(5, 10)).toBe(40);
    });

    it('deve retornar 0 para page 1', () => {
      expect(getPaginationOffset(1, 100)).toBe(0);
    });
  });

  describe('buildPaginatedResult', () => {
    it('deve construir resultado paginado', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = buildPaginatedResult(data, 100, 1, 50);

      expect(result).toEqual({
        data,
        total: 100,
        page: 1,
        pageSize: 50,
        totalPages: 2
      });
    });

    it('deve calcular totalPages arredondando para cima', () => {
      const result1 = buildPaginatedResult([], 105, 1, 50);
      expect(result1.totalPages).toBe(3);

      const result2 = buildPaginatedResult([], 100, 1, 50);
      expect(result2.totalPages).toBe(2);

      const result3 = buildPaginatedResult([], 1, 1, 50);
      expect(result3.totalPages).toBe(1);
    });

    it('deve retornar totalPages como 0 quando total é 0', () => {
      const result = buildPaginatedResult([], 0, 1, 50);
      expect(result.totalPages).toBe(0);
    });
  });
});
