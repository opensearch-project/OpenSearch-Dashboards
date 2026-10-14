/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAddFieldTransformation, generateAlias } from './add_field_transformation';
import { VisFieldType } from '../../visualizations/types';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('add_field_transformation', () => {
  const instance = createAddFieldTransformation();
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createHit({ price: 100, quantity: 3, tax: 10 }),
      createHit({ price: 200, quantity: 5, tax: 20 }),
    ];

    describe('binary mode', () => {
      it.each([
        {
          operator: '+' as const,
          field2: 'tax',
          alias: 'total',
          expected: 110,
        },
        {
          operator: '-' as const,
          field2: 'tax',
          alias: 'net',
          expected: 90,
        },
        {
          operator: '*' as const,
          field2: 'quantity',
          alias: 'subtotal',
          expected: 300,
        },
        {
          operator: '/' as const,
          field2: 'quantity',
          alias: 'unit_price',
          expected: 100 / 3,
        },
      ])('derives $alias using the $operator operator', ({ operator, field2, alias, expected }) => {
        const result = transform(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: operator,
          field2,
          field2CustomValue: '',
          alias,
        });
        expect((result[0]._source as Record<string, unknown>)[alias]).toBeCloseTo(expected);
      });

      it('handles division by zero', () => {
        const zeroData = [createHit({ a: 10, b: 0 })];
        const result = transform(zeroData, {
          ...instance.config,
          mode: 'binary',
          field1: 'a',
          field1CustomValue: '',
          binaryOperator: '/',
          field2: 'b',
          field2CustomValue: '',
          alias: 'result',
        });
        expect((result[0]._source as Record<string, unknown>).result).toBeUndefined();
      });

      it('supports custom value for field', () => {
        const result = transform(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: '*',
          field2: '__CUSTOM__',
          field2CustomValue: '2',
          alias: 'doubled',
        });
        expect((result[0]._source as Record<string, unknown>).doubled).toBe(200);
      });
    });

    describe('unary mode', () => {
      it.each([
        { operator: 'abs' as const, value: -5, expected: 5 },
        { operator: 'ceil' as const, value: 3.2, expected: 4 },
        { operator: 'floor' as const, value: 3.9, expected: 3 },
        { operator: 'round' as const, value: 3.5, expected: 4 },
      ])('applies $operator', ({ operator, value, expected }) => {
        const result = transform([createHit({ val: value })], {
          ...instance.config,
          mode: 'unary',
          unaryOperator: operator,
          unaryField: 'val',
          alias: 'result',
        });
        expect((result[0]._source as Record<string, unknown>).result).toBe(expected);
      });
    });

    describe('crossFields mode', () => {
      it.each([
        { operator: 'total' as const, alias: 'sum', expected: 110 },
        { operator: 'mean' as const, alias: 'average', expected: 55 },
      ])('calculates $operator across multiple fields', ({ operator, alias, expected }) => {
        const result = transform(data, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: operator,
          crossFields: [
            { name: 'price', visFieldType: VisFieldType.Numerical },
            { name: 'tax', visFieldType: VisFieldType.Numerical },
          ],
          alias,
        });
        expect((result[0]._source as Record<string, unknown>)[alias]).toBe(expected);
      });

      it('evaluates expression with field references', () => {
        const result = transform(data, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: 'expression',
          expression: '${price} * ${quantity} + ${tax}',
          crossFields: [],
          alias: 'computed',
        });
        expect((result[0]._source as Record<string, unknown>).computed).toBe(310);
      });

      it('evaluates expression fields using nested paths', () => {
        const nestedData = [createHit({ details: { price: 100 }, quantity: 3 })];
        const result = transform(nestedData, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: 'expression',
          expression: '${details.price} * ${quantity}',
          crossFields: [],
          alias: 'computed',
        });

        expect((result[0]._source as Record<string, unknown>).computed).toBe(300);
      });
    });
  });

  describe('generateAlias', () => {
    it('generates alias for binary mode', () => {
      expect(
        generateAlias({
          mode: 'binary',
          field1: 'a',
          field1CustomValue: '',
          binaryOperator: '+',
          field2: 'b',
          field2CustomValue: '',
        })
      ).toBe('a_plus_b');
    });

    it('generates alias for unary mode', () => {
      expect(
        generateAlias({
          mode: 'unary',
          unaryOperator: 'abs',
          unaryField: 'val',
        })
      ).toBe('abs(val)');
    });

    it('generates alias for crossFields total', () => {
      expect(
        generateAlias({
          mode: 'crossFields',
          crossFieldsOperator: 'total',
          crossFields: [
            { name: 'a', visFieldType: VisFieldType.Numerical },
            { name: 'b', visFieldType: VisFieldType.Numerical },
          ],
        })
      ).toBe('total(a, b)');
    });

    it('generates alias for crossFields expression', () => {
      expect(
        generateAlias({
          mode: 'crossFields',
          crossFieldsOperator: 'expression',
          expression: '${a} + ${b}',
          crossFields: [],
        })
      ).toBe('${a} + ${b}');
    });
  });

  describe('execution diagnostics', () => {
    const data = [createHit({ price: 100, tax: 10 })];

    it('skips when a binary field no longer exists', () => {
      const config = {
        ...instance.config,
        mode: 'binary' as const,
        field1: 'removed',
        field2: 'price',
      };
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('skips when the unary field no longer exists', () => {
      const config = { ...instance.config, mode: 'unary' as const, unaryField: 'removed' };
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('uses available cross-field inputs and reports missing inputs', () => {
      const config = {
        ...instance.config,
        mode: 'crossFields' as const,
        crossFieldsOperator: 'total' as const,
        crossFields: [
          { name: 'price', visFieldType: VisFieldType.Numerical },
          { name: 'removed', visFieldType: VisFieldType.Numerical },
        ],
      };
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: [createHit({ price: 100, tax: 10, 'total(price, removed)': 100 })],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('applies a binary calculation only to rows containing both fields', () => {
      const config = {
        ...instance.config,
        mode: 'binary' as const,
        field1: 'price',
        field2: 'tax',
        alias: 'total',
      };
      const mixedData = [createHit({ price: 100, tax: 10 }), createHit({ price: 200 })];

      expect(instance.transformationMethod(mixedData, config)).toMatchObject({
        rows: [createHit({ price: 100, tax: 10, total: 110 }), createHit({ price: 200 })],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['tax'] }],
      });
    });

    it('applies a unary calculation only to rows containing its field', () => {
      const config = {
        ...instance.config,
        mode: 'unary' as const,
        unaryField: 'price',
        alias: 'absolute_price',
      };
      const mixedData = [createHit({ price: -10 }), createHit({ label: 'missing price' })];

      expect(instance.transformationMethod(mixedData, config)).toMatchObject({
        rows: [
          createHit({ price: -10, absolute_price: 10 }),
          createHit({ label: 'missing price' }),
        ],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['price'] }],
      });
    });

    it('skips when an expression references missing fields', () => {
      const config = {
        ...instance.config,
        mode: 'crossFields' as const,
        crossFieldsOperator: 'expression' as const,
        expression: '${price} + ${removed}',
      };
      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('skips when the calculation is incomplete', () => {
      const config = { ...instance.config, mode: 'unary' as const, unaryField: undefined };

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
    });
  });

  describe('createAddFieldTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('add_field');
      expect(instance.config.mode).toBe('binary');
      expect(instance.config.binaryOperator).toBe('+');
      expect(instance.hide).toBe(false);
    });
  });
});
