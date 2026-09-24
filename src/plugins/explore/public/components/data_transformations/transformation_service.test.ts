/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransformationService } from './transformation_service';
import { TransformationDefinition, TransformationInstance } from './types';
import { VisFieldType } from '../visualizations/types';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

const createMockDefinition = (
  id: string,
  transformFn?: (data: any[], config: any) => any[]
): TransformationDefinition => {
  let instanceCount = 0;

  return {
    id,
    type: 'test',
    label: id,
    description: `${id} description`,
    iconType: 'empty',
    createInstance: () => ({
      instance_id: `instance_${id}_${instanceCount++}`,
      definition_id: id,
      config: {},
      hide: false,
      transformationMethod: (data, config) => ({
        rows: transformFn ? transformFn(data, config) : data,
        status: 'applied',
        issues: [],
      }),
      Editor: (() => null) as any,
    }),
  };
};

describe('TransformationService', () => {
  let service: TransformationService;

  beforeEach(() => {
    service = new TransformationService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('registerDefinition', () => {
    it('registers a transformation definition', () => {
      const def = createMockDefinition('limit');
      service.registerDefinition(def);
      expect(service.getDefinition('limit')).toBe(def);
    });

    it('overwrites existing definition with same id', () => {
      const def1 = createMockDefinition('limit');
      const def2 = createMockDefinition('limit');
      service.registerDefinition(def1);
      service.registerDefinition(def2);
      expect(service.getDefinition('limit')).toBe(def2);
    });
  });

  describe('getDefinitions', () => {
    it('returns all registered definitions', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.registerDefinition(createMockDefinition('sort'));
      expect(service.getDefinitions()).toHaveLength(2);
    });

    it('returns empty array when nothing registered', () => {
      expect(service.getDefinitions()).toEqual([]);
    });
  });

  describe('getDefinitionsByType', () => {
    it('filters definitions by type', () => {
      const filterDef: TransformationDefinition = {
        ...createMockDefinition('filter'),
        type: 'filter',
      };
      const sortDef: TransformationDefinition = {
        ...createMockDefinition('sort'),
        type: 'sort',
      };
      service.registerDefinition(filterDef);
      service.registerDefinition(sortDef);
      expect(service.getDefinitionsByType('filter')).toHaveLength(1);
      expect(service.getDefinitionsByType('filter')[0].id).toBe('filter');
    });
  });

  describe('addInstance', () => {
    it('adds an instance to the pipeline', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      expect(service.pipeline$.getValue()).toHaveLength(1);
      expect(service.pipeline$.getValue()[0].definition_id).toBe('limit');
    });

    it('throws when definition id is unknown', () => {
      expect(() => service.addInstance('unknown')).toThrow();
    });
  });

  describe('removeInstance', () => {
    it('removes an instance from the pipeline', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.removeInstance(instanceId);
      expect(service.pipeline$.getValue()).toHaveLength(0);
    });
  });

  describe('updateInstanceConfig', () => {
    it('updates config for matching instance', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.updateInstanceConfig(instanceId, { limit: 5 });
      expect(service.pipeline$.getValue()[0].config).toEqual({ limit: 5 });
    });
  });

  describe('toggleInstanceHide', () => {
    it('toggles hide state of an instance', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      expect(service.pipeline$.getValue()[0].hide).toBe(false);
      service.toggleInstanceHide(instanceId);
      expect(service.pipeline$.getValue()[0].hide).toBe(true);
    });
  });

  describe('clearPipeline', () => {
    it('clears all instances from the pipeline', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      service.addInstance('limit');
      service.clearPipeline();
      expect(service.pipeline$.getValue()).toHaveLength(0);
    });
  });

  describe('applyPipeline', () => {
    it('returns raw rows when pipeline is empty', () => {
      const rows = [createHit({ a: 1 }), createHit({ b: 2 })];
      const originalSchema = [{ name: 'a', type: 'integer' }];
      const { rows: result, finalSchema, steps } = service.applyPipeline(rows, originalSchema);
      expect(result).toEqual(rows);
      expect(finalSchema).toEqual(originalSchema);
      expect(steps).toEqual([]);
    });

    it('skips hidden instances', () => {
      const limitDef = createMockDefinition('limit', (data, config) => data.slice(0, config.limit));
      service.registerDefinition(limitDef);
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.updateInstanceConfig(instanceId, { limit: 1 });
      service.toggleInstanceHide(instanceId);

      const rows = [createHit({ a: 1 }), createHit({ a: 2 })];
      const result = service.applyPipeline(rows);
      expect(result.rows).toEqual(rows);
      expect(result.steps).toEqual([
        expect.objectContaining({
          instanceId,
          definitionId: 'limit',
          status: 'skipped',
          issues: [],
        }),
      ]);
    });

    it('applies multiple transformations in order', () => {
      const addFieldDef: TransformationDefinition = {
        id: 'add_field',
        type: 'transform',
        label: 'Add Field',
        description: '',
        iconType: '',
        createInstance: () => ({
          instance_id: 'instance_add',
          definition_id: 'add_field',
          config: {},
          hide: false,
          transformationMethod: (data) => ({
            rows: data.map((row) => ({
              ...row,
              _source: { ...(row._source as Record<string, unknown>), added: true },
            })),
            status: 'applied',
            issues: [],
          }),
          Editor: (() => null) as any,
        }),
      };
      const limitDef = createMockDefinition('limit', (data) => data.slice(0, 1));

      service.registerDefinition(addFieldDef);
      service.registerDefinition(limitDef);
      service.addInstance('add_field');
      service.addInstance('limit');

      const rows = [createHit({ a: 1 }), createHit({ a: 2 })];
      const { rows: result, finalSchema } = service.applyPipeline(rows, [
        { name: 'a', type: 'integer' },
      ]);
      expect(result).toHaveLength(1);
      expect((result[0]._source as Record<string, unknown>).added).toBe(true);
      expect(finalSchema).toEqual([
        { name: 'a', type: 'integer' },
        { name: 'added', type: 'boolean' },
      ]);
    });

    it('reconciles transformed fields while preserving source schema order and types', () => {
      const addFieldDefinition: TransformationDefinition = {
        ...createMockDefinition('add_field'),
        createInstance: () => ({
          instance_id: 'add_field_instance',
          definition_id: 'add_field',
          config: {},
          hide: false,
          transformationMethod: (data) => ({
            rows: data.map((row) => ({
              ...row,
              _source: {
                Series: (row._source as Record<string, unknown>).Series,
                Time: (row._source as Record<string, unknown>).Time,
                derived: true,
              },
            })),
            status: 'applied',
            issues: [],
          }),
          Editor: (() => null) as any,
        }),
      };
      service.registerDefinition(addFieldDefinition);
      service.addInstance('add_field');

      const result = service.applyPipeline(
        [createHit({ Time: 1000, Series: 'requests', Value: 1 })],
        [
          { name: 'Value', type: 'number' },
          { name: 'Time', type: 'time' },
          { name: 'Series', type: 'string' },
        ]
      );

      expect(result.finalSchema).toEqual([
        { name: 'Time', type: 'time' },
        { name: 'Series', type: 'string' },
        { name: 'derived', type: 'boolean' },
      ]);
    });

    it('applies explicit type overrides returned by a transformation', () => {
      const convertDefinition: TransformationDefinition = {
        ...createMockDefinition('convert'),
        createInstance: () => ({
          instance_id: 'convert_instance',
          definition_id: 'convert',
          config: {},
          hide: false,
          transformationMethod: (data) => ({
            rows: data.map((row) => ({
              ...row,
              _source: { ...(row._source as Record<string, unknown>), count: 42 },
            })),
            status: 'applied',
            issues: [],
            typeOverrides: { count: 'number' },
          }),
          Editor: (() => null) as any,
        }),
      };
      service.registerDefinition(convertDefinition);
      service.addInstance('convert');

      const result = service.applyPipeline(
        [createHit({ count: '42' })],
        [{ name: 'count', type: 'keyword' }]
      );

      expect(result.finalSchema).toEqual([{ name: 'count', type: 'number' }]);
    });

    it('provides each transformation editor with the fields entering that step', () => {
      const addFieldDefinition: TransformationDefinition = {
        ...createMockDefinition('add_field'),
        createInstance: () => ({
          instance_id: 'add_field_instance',
          definition_id: 'add_field',
          config: {},
          hide: false,
          transformationMethod: (data) => ({
            rows: data.map((row) => ({
              ...row,
              _source: { ...(row._source as Record<string, unknown>), added: true },
            })),
            status: 'applied',
            issues: [],
          }),
          Editor: (() => null) as any,
        }),
      };
      const followingDefinition = createMockDefinition('following');
      service.registerDefinition(addFieldDefinition);
      service.registerDefinition(followingDefinition);
      service.addInstance('add_field');
      service.addInstance('following');
      const [addFieldInstance, followingInstance] = service.pipeline$.getValue();

      service.applyPipeline([createHit({ original: 1 })]);
      const stageFields = service.stageFields$.getValue();

      expect(stageFields.get(addFieldInstance.instance_id)).toEqual([
        { name: 'original', visFieldType: VisFieldType.Numerical },
      ]);
      expect(stageFields.get(followingInstance.instance_id)).toEqual([
        { name: 'original', visFieldType: VisFieldType.Numerical },
        { name: 'added', visFieldType: VisFieldType.Categorical },
      ]);
    });

    it('collects execution diagnostics without updating the pipeline', () => {
      const transformationMethod = jest.fn((data) => ({
        rows: data,
        status: 'partially_applied' as const,
        issues: [
          {
            code: 'missing_fields' as const,
            fields: ['removed'],
            message: 'Field is unavailable in the current data: removed',
          },
        ],
      }));
      const def: TransformationDefinition = {
        id: 'validated',
        type: 'test',
        label: 'Validated',
        description: '',
        iconType: '',
        createInstance: () => ({
          instance_id: 'instance_validated',
          definition_id: 'validated',
          config: { field: 'removed' },
          hide: false,
          transformationMethod,
          Editor: (() => null) as any,
        }),
      };
      service.registerDefinition(def);
      service.addInstance('validated');

      const rows = [createHit({ name: 'Alice' })];
      const result = service.applyPipeline(rows);

      expect(transformationMethod).toHaveBeenCalledWith(rows, { field: 'removed' });
      expect(result.steps[0]).toMatchObject({
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
      expect(service.pipeline$.getValue()[0].config).toEqual({ field: 'removed' });
    });

    it('returns an empty final schema when an active transformation removes every row', () => {
      const limitDefinition = createMockDefinition('limit', () => []);
      service.registerDefinition(limitDefinition);
      service.addInstance('limit');

      const result = service.applyPipeline(
        [createHit({ name: 'Alice' })],
        [{ name: 'name', type: 'string' }]
      );

      expect(result.rows).toEqual([]);
      expect(result.finalSchema).toEqual([]);
    });

    it('reports a failed step, preserves its input, and continues the pipeline', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const failingDefinition: TransformationDefinition = {
        ...createMockDefinition('failing'),
        createInstance: () => ({
          instance_id: 'instance_failing',
          definition_id: 'failing',
          config: {},
          hide: false,
          transformationMethod: () => {
            throw new Error('execution failed');
          },
          Editor: (() => null) as any,
        }),
      };
      const followingDefinition = createMockDefinition('following', (data) =>
        data.map((row) => ({
          ...row,
          _source: { ...(row._source as Record<string, unknown>), continued: true },
        }))
      );
      service.registerDefinition(failingDefinition);
      service.registerDefinition(followingDefinition);
      service.addInstance('failing');
      service.addInstance('following');

      const result = service.applyPipeline([createHit({ name: 'Alice' })]);
      consoleError.mockRestore();

      expect(result.rows[0]._source).toEqual({ name: 'Alice', continued: true });
      expect(result.steps[0]).toMatchObject({
        status: 'failed',
        issues: [{ code: 'execution_error', message: 'execution failed' }],
      });
      expect(result.steps[1]).toMatchObject({ status: 'applied' });
    });
  });

  describe('restoreFromState', () => {
    it('restores persisted definition, config, and visibility', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.restoreFromState([{ definitionId: 'limit', config: { limit: 5 }, hide: true }]);

      const [instance] = service.pipeline$.getValue();
      expect(instance.definition_id).toBe('limit');
      expect(instance.config).toEqual({ limit: 5 });
      expect(instance.hide).toBe(true);
    });

    it('skips unknown definitions', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.restoreFromState([
        { definitionId: 'unknown', config: {}, hide: false },
        { definitionId: 'limit', config: { limit: 3 }, hide: false },
      ]);
      expect(service.pipeline$.getValue()).toHaveLength(1);
    });

    it('does nothing for empty array', () => {
      service.restoreFromState([]);
      expect(service.pipeline$.getValue()).toHaveLength(0);
    });

    it.each([null, undefined])('does nothing for %s input', (state) => {
      service.restoreFromState(state as any);
      expect(service.pipeline$.getValue()).toHaveLength(0);
    });
  });

  describe('setPipeline', () => {
    it('replaces entire pipeline', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');

      const newPipeline: TransformationInstance[] = [];
      service.setPipeline(newPipeline);
      expect(service.pipeline$.getValue()).toHaveLength(0);
    });
  });

  describe('destroy', () => {
    it('completes observables', () => {
      let completed = false;
      service.pipeline$.subscribe({ complete: () => (completed = true) });
      service.destroy();
      expect(completed).toBe(true);
    });
  });
});
