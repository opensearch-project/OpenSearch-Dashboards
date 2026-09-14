/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerGetTransformationSchemaAction } from './get_transformation_schema_action';

// The schemas imported from data_transformations are plain objects — no need to mock them.
// We only need to verify the handler behaviour via the registered action.

const registerAndGetAction = (): any => {
  let captured: any;
  const registerAction = jest.fn((action: any) => {
    captured = action;
  });
  registerGetTransformationSchemaAction(registerAction);
  return captured;
};

describe('registerGetTransformationSchemaAction', () => {
  it('does nothing when registerAction is undefined', () => {
    expect(() => registerGetTransformationSchemaAction(undefined as any)).not.toThrow();
  });

  it('registers an action with the correct tool name', () => {
    const action = registerAndGetAction();
    expect(action.name).toBe('get_transformation_schema');
    expect(typeof action.handler).toBe('function');
  });
});

describe('get_transformation_schema handler', () => {
  it('returns schemas for all known definition ids', async () => {
    const action = registerAndGetAction();
    const knownIds = [
      'limit',
      'sort_by',
      'filter',
      'filter_fields',
      'convert_field_type',
      'group_by',
      'extract_fields',
      'add_field',
    ];

    const result = await action.handler({ definitionIds: knownIds });

    expect(result.success).toBe(true);
    expect(Object.keys(result.schemas)).toHaveLength(knownIds.length);
    for (const id of knownIds) {
      expect(result.schemas[id]).toBeDefined();
      // Each schema should be an object with at least one field spec.
      expect(typeof result.schemas[id]).toBe('object');
      expect(result.schemas[id]).not.toHaveProperty('error');
    }
  });

  it('returns a single schema for a single valid id', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['limit'] });

    expect(result.success).toBe(true);
    expect(result.schemas.limit).toBeDefined();
    // The limit schema should describe a "limit" field of kind "number".
    expect(result.schemas.limit.limit).toBeDefined();
    expect(result.schemas.limit.limit.kind).toBe('number');
  });

  it('returns schemas for multiple ids in one call', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['limit', 'sort_by'] });

    expect(result.success).toBe(true);
    expect(result.schemas.limit).toBeDefined();
    expect(result.schemas.sort_by).toBeDefined();
  });

  it('returns an error entry for an unknown id', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['nonexistent'] });

    expect(result.success).toBe(false);
    expect(result.schemas.nonexistent).toHaveProperty('error');
    expect(result.schemas.nonexistent.error).toContain('nonexistent');
    expect(result.schemas.nonexistent.error).toContain('Available types');
  });

  it('returns mixed results when some ids are valid and some are not', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['limit', 'bogus'] });

    expect(result.success).toBe(false); // unknown.length > 0
    expect(result.schemas.limit).toBeDefined();
    expect(result.schemas.limit).not.toHaveProperty('error');
    expect(result.schemas.bogus).toHaveProperty('error');
  });

  it('includes a helpful message pointing to auto_create_visualization', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['filter'] });

    expect(result.message).toContain('auto_create_visualization');
  });

  it('message mentions all unknown ids when none are valid', async () => {
    const action = registerAndGetAction();
    const result = await action.handler({ definitionIds: ['bad1', 'bad2'] });

    expect(result.message).toContain('Available');
  });

  describe('filter schema', () => {
    it('exposes byFieldType with base, numerical, and date operator sets', async () => {
      const action = registerAndGetAction();
      const result = await action.handler({ definitionIds: ['filter'] });

      const filterSchema = result.schemas.filter;
      const operatorSpec = filterSchema.operator;
      expect(operatorSpec).toBeDefined();
      expect(operatorSpec.byFieldType).toBeDefined();
      expect(operatorSpec.byFieldType.base.length).toBeGreaterThan(0);
      expect(operatorSpec.byFieldType.numerical.length).toBeGreaterThan(0);
      expect(operatorSpec.byFieldType.date.length).toBeGreaterThan(0);
      // Base operators should include "equals"
      expect(operatorSpec.byFieldType.base.map((o: any) => o.value)).toContain('equals');
      // Numerical extras should include "greater_than"
      expect(operatorSpec.byFieldType.numerical.map((o: any) => o.value)).toContain('greater_than');
      // Date extras should include "is_earlier"
      expect(operatorSpec.byFieldType.date.map((o: any) => o.value)).toContain('is_earlier');
    });
  });

  describe('add_field schema', () => {
    it('has a mode field with discriminates listing all mode-dependent fields', async () => {
      const action = registerAndGetAction();
      const result = await action.handler({ definitionIds: ['add_field'] });

      const schema = result.schemas.add_field;
      expect(schema.mode).toBeDefined();
      expect(schema.mode.discriminates).toBeDefined();
      expect(schema.mode.discriminates).toContain('field1');
      expect(schema.mode.discriminates).toContain('unaryField');
      expect(schema.mode.discriminates).toContain('crossFields');
    });

    it('documents binary, unary, and crossFields mode options', async () => {
      const action = registerAndGetAction();
      const result = await action.handler({ definitionIds: ['add_field'] });

      const modeValues = result.schemas.add_field.mode.enumOptions.map((o: any) => o.value);
      expect(modeValues).toContain('binary');
      expect(modeValues).toContain('unary');
      expect(modeValues).toContain('crossFields');
    });
  });
});
