/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAddFieldTransformation, generateAlias } from './add_field_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('add_field_transformation', () => {
  const instance = createAddFieldTransformation();

  describe('transformationMethod', () => {
    const data = [
      createHit({ price: 100, quantity: 3, tax: 10 }),
      createHit({ price: 200, quantity: 5, tax: 20 }),
    ];

    it('returns original data when config is incomplete', () => {
      const result = instance.transformationMethod(data, {
        ...instance.config,
        field1: undefined,
        field2: undefined,
      });
      expect(result).toEqual(data);
    });

    describe('binary mode', () => {
      it('adds two fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: '+',
          field2: 'tax',
          field2CustomValue: '',
          alias: 'total',
        });
        expect((result[0]._source as Record<string, unknown>).total).toBe(110);
        expect((result[1]._source as Record<string, unknown>).total).toBe(220);
      });

      it('subtracts two fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: '-',
          field2: 'tax',
          field2CustomValue: '',
          alias: 'net',
        });
        expect((result[0]._source as Record<string, unknown>).net).toBe(90);
      });

      it('multiplies two fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: '*',
          field2: 'quantity',
          field2CustomValue: '',
          alias: 'subtotal',
        });
        expect((result[0]._source as Record<string, unknown>).subtotal).toBe(300);
      });

      it('divides two fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'binary',
          field1: 'price',
          field1CustomValue: '',
          binaryOperator: '/',
          field2: 'quantity',
          field2CustomValue: '',
          alias: 'unit_price',
        });
        expect((result[0]._source as Record<string, unknown>).unit_price).toBeCloseTo(33.33, 1);
      });

      it('handles division by zero', () => {
        const zeroData = [createHit({ a: 10, b: 0 })];
        const result = instance.transformationMethod(zeroData, {
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
        const result = instance.transformationMethod(data, {
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
      it('applies abs', () => {
        const negData = [createHit({ val: -5 })];
        const result = instance.transformationMethod(negData, {
          ...instance.config,
          mode: 'unary',
          unaryOperator: 'abs',
          unaryField: 'val',
          alias: 'abs_val',
        });
        expect((result[0]._source as Record<string, unknown>).abs_val).toBe(5);
      });

      it('applies ceil', () => {
        const floatData = [createHit({ val: 3.2 })];
        const result = instance.transformationMethod(floatData, {
          ...instance.config,
          mode: 'unary',
          unaryOperator: 'ceil',
          unaryField: 'val',
          alias: 'ceil_val',
        });
        expect((result[0]._source as Record<string, unknown>).ceil_val).toBe(4);
      });

      it('applies floor', () => {
        const floatData = [createHit({ val: 3.9 })];
        const result = instance.transformationMethod(floatData, {
          ...instance.config,
          mode: 'unary',
          unaryOperator: 'floor',
          unaryField: 'val',
          alias: 'floor_val',
        });
        expect((result[0]._source as Record<string, unknown>).floor_val).toBe(3);
      });

      it('applies round', () => {
        const floatData = [createHit({ val: 3.5 })];
        const result = instance.transformationMethod(floatData, {
          ...instance.config,
          mode: 'unary',
          unaryOperator: 'round',
          unaryField: 'val',
          alias: 'round_val',
        });
        expect((result[0]._source as Record<string, unknown>).round_val).toBe(4);
      });
    });

    describe('crossFields mode', () => {
      it('calculates total of multiple fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: 'total',
          crossFields: [
            { name: 'price', visFieldType: 0 },
            { name: 'tax', visFieldType: 0 },
          ],
          alias: 'sum',
        });
        expect((result[0]._source as Record<string, unknown>).sum).toBe(110);
      });

      it('calculates mean of multiple fields', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: 'mean',
          crossFields: [
            { name: 'price', visFieldType: 0 },
            { name: 'tax', visFieldType: 0 },
          ],
          alias: 'avg',
        });
        expect((result[0]._source as Record<string, unknown>).avg).toBe(55);
      });

      it('evaluates expression with field references', () => {
        const result = instance.transformationMethod(data, {
          ...instance.config,
          mode: 'crossFields',
          crossFieldsOperator: 'expression',
          expression: '${price} * ${quantity} + ${tax}',
          crossFields: [],
          alias: 'computed',
        });
        expect((result[0]._source as Record<string, unknown>).computed).toBe(310);
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
            { name: 'a', visFieldType: 0 },
            { name: 'b', visFieldType: 0 },
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

  describe('validateConfig', () => {
    it('resets binary fields that no longer exist', () => {
      const config = {
        ...instance.config,
        mode: 'binary' as const,
        field1: 'removed',
        field2: 'price',
      };
      const fields = [{ name: 'price' }, { name: 'tax' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.field1).toBeUndefined();
      expect(result.field2).toBe('price');
    });

    it('resets unary field that no longer exists', () => {
      const config = { ...instance.config, mode: 'unary' as const, unaryField: 'removed' };
      const fields = [{ name: 'price' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.unaryField).toBeUndefined();
    });

    it('removes invalid crossFields entries', () => {
      const config = {
        ...instance.config,
        mode: 'crossFields' as const,
        crossFieldsOperator: 'total' as const,
        crossFields: [
          { name: 'price', visFieldType: 0 },
          { name: 'removed', visFieldType: 0 },
        ],
      };
      const fields = [{ name: 'price' }, { name: 'tax' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.crossFields).toHaveLength(1);
      expect(result.crossFields[0].name).toBe('price');
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
