import { describe, it, expect } from 'vitest';
import { arrayHelpers } from './arrayHelpers';

describe('arrayHelpers', () => {
  describe('groupBy', () => {
    it('deve agrupar itens por chave', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' }
      ];

      const result = arrayHelpers.groupBy(items, 'category');
      
      expect(result).toEqual({
        A: [{ id: 1, category: 'A' }, { id: 3, category: 'A' }],
        B: [{ id: 2, category: 'B' }]
      });
    });
  });

  describe('unique', () => {
    it('deve remover duplicados', () => {
      expect(arrayHelpers.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(arrayHelpers.unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('uniqueBy', () => {
    it('deve remover duplicados por propriedade', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' }
      ];

      const result = arrayHelpers.uniqueBy(items, 'id');
      expect(result).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ]);
    });
  });

  describe('sortBy', () => {
    it('deve ordenar por propriedade ascendente', () => {
      const items = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ];

      const result = arrayHelpers.sortBy(items, 'id', 'asc');
      expect(result[0].id).toBe(1);
      expect(result[2].id).toBe(3);
    });

    it('deve ordenar por propriedade descendente', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 3, name: 'C' },
        { id: 2, name: 'B' }
      ];

      const result = arrayHelpers.sortBy(items, 'id', 'desc');
      expect(result[0].id).toBe(3);
      expect(result[2].id).toBe(1);
    });
  });

  describe('chunk', () => {
    it('deve dividir array em pedaços', () => {
      const result = arrayHelpers.chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('sumBy', () => {
    it('deve somar valores por propriedade', () => {
      const items = [
        { value: 10 },
        { value: 20 },
        { value: 30 }
      ];

      expect(arrayHelpers.sumBy(items, 'value')).toBe(60);
    });
  });

  describe('averageBy', () => {
    it('deve calcular média por propriedade', () => {
      const items = [
        { value: 10 },
        { value: 20 },
        { value: 30 }
      ];

      expect(arrayHelpers.averageBy(items, 'value')).toBe(20);
    });

    it('deve retornar 0 para array vazio', () => {
      expect(arrayHelpers.averageBy([], 'value')).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('deve detectar arrays vazios', () => {
      expect(arrayHelpers.isEmpty([])).toBe(true);
      expect(arrayHelpers.isEmpty(null)).toBe(true);
      expect(arrayHelpers.isEmpty(undefined)).toBe(true);
      expect(arrayHelpers.isEmpty([1])).toBe(false);
    });
  });

  describe('take', () => {
    it('deve pegar primeiros N itens', () => {
      expect(arrayHelpers.take([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
    });
  });

  describe('skip', () => {
    it('deve pular primeiros N itens', () => {
      expect(arrayHelpers.skip([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
    });
  });
});
