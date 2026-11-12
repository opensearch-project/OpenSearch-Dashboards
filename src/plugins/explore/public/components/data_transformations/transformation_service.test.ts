/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransformationService } from './transformation_service';
import {
  MultiSeriesTransformationInstance,
  TransformationDefinition,
  TransformationInstance,
} from './types';
const createRow = (source: Record<string, unknown>) => source;

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
    it('returns raw rows and reconciles the schema when the pipeline is empty', () => {
      const rows = [createRow({ a: 1, b: 'value' }), createRow({ a: 2, c: true })];
      const originalSchema = [{ name: 'a', type: 'long' }, { name: 'b' }, { type: 'string' }];
      const { rows: result, finalSchema, steps } = service.applyPipeline(rows, originalSchema);
      expect(result).toEqual(rows);
      expect(finalSchema).toEqual([
        { name: 'a', type: 'long' },
        { name: 'b', type: 'string' },
        { name: 'c', type: 'boolean' },
      ]);
      expect(steps).toEqual([]);
    });

    it('skips hidden instances', () => {
      const limitDef = createMockDefinition('limit', (data, config) => data.slice(0, config.limit));
      service.registerDefinition(limitDef);
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.updateInstanceConfig(instanceId, { limit: 1 });
      service.toggleInstanceHide(instanceId);

      const rows = [createRow({ a: 1 }), createRow({ a: 2 })];
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
              added: true,
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

      const rows = [createRow({ a: 1 }), createRow({ a: 2 })];
      const { rows: result, finalSchema } = service.applyPipeline(rows, [
        { name: 'a', type: 'integer' },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].added).toBe(true);
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
              Series: row.Series,
              Time: row.Time,
              derived: true,
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
        [createRow({ Time: 1000, Series: 'requests', Value: 1 })],
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
              count: 42,
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
        [createRow({ count: '42' })],
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
              added: true,
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

      service.applyPipeline([createRow({ original: 1 })]);
      const stageFields = service.stageFields$.getValue();

      expect(stageFields.get(addFieldInstance.instance_id)).toEqual([
        { name: 'original', type: 'integer' },
      ]);
      expect(stageFields.get(followingInstance.instance_id)).toEqual([
        { name: 'original', type: 'integer' },
        { name: 'added', type: 'boolean' },
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

      const rows = [createRow({ name: 'Alice' })];
      const result = service.applyPipeline(rows);

      expect(transformationMethod).toHaveBeenCalledWith(rows, { field: 'removed' });
      expect(result.steps[0]).toMatchObject({
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
      expect(service.pipeline$.getValue()[0].config).toEqual({ field: 'removed' });
    });

    it('preserves the current schema when an active transformation removes every row', () => {
      const limitDefinition = createMockDefinition('limit', () => []);
      service.registerDefinition(limitDefinition);
      service.addInstance('limit');

      const originalSchema = [{ name: 'name', type: 'string' }];
      const result = service.applyPipeline([createRow({ name: 'Alice' })], originalSchema);

      expect(result.rows).toEqual([]);
      expect(result.finalSchema).toEqual(originalSchema);
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
          continued: true,
        }))
      );
      service.registerDefinition(failingDefinition);
      service.registerDefinition(followingDefinition);
      service.addInstance('failing');
      service.addInstance('following');

      const result = service.applyPipeline([createRow({ name: 'Alice' })]);
      consoleError.mockRestore();

      expect(result.rows[0]).toEqual({ name: 'Alice', continued: true });
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

  describe('stepResults$', () => {
    it('publishes each step result keyed by instance id', () => {
      service.registerDefinition({
        ...createMockDefinition('missing'),
        createInstance: () => ({
          instance_id: 'missing_1',
          definition_id: 'missing',
          config: {},
          hide: false,
          transformationMethod: (data: any[]) => ({
            rows: data,
            status: 'skipped',
            issues: [{ code: 'missing_fields', fields: ['host'], message: 'missing' }],
          }),
          Editor: (() => null) as any,
        }),
      });
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('missing');
      service.addInstance('limit');

      service.applyPipeline([createRow({ a: 1 })]);

      const results = service.stepResults$.getValue();
      expect(results.get('missing_1')).toMatchObject({
        status: 'skipped',
        issues: [expect.objectContaining({ code: 'missing_fields', fields: ['host'] })],
      });
      expect(results.size).toBe(2);
    });

    it('clears when the pipeline is empty', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.addInstance('limit');
      service.applyPipeline([createRow({ a: 1 })]);
      service.setPipeline([]);

      service.applyPipeline([createRow({ a: 1 })]);

      expect(service.stepResults$.getValue().size).toBe(0);
    });
  });
});

describe('TransformationService.applyPipelineToSeries', () => {
  let service: TransformationService;
  const num = (name: string) => ({ name, type: 'number' });
  const str = (name: string) => ({ name, type: 'string' });
  const oneSeries = (refId: string, rows: Array<Record<string, unknown>>, schema: any[]) => ({
    refId,
    rows,
    fieldSchema: schema,
  });
  const seriesA = () => oneSeries('A', [{ size: 'S', value: 1 }], [str('size'), num('value')]);
  const seriesB = () => oneSeries('B', [{ cate: 'X', value: 2 }], [str('cate'), num('value')]);

  // A single-series step that keeps the rows where `field` is present, like a field-based step.
  const fieldStep = (field: string): TransformationInstance => ({
    instance_id: `step_${field}`,
    definition_id: 'field_step',
    config: { field },
    hide: false,
    transformationMethod: (rows, config: any) =>
      rows.some((row) => config.field in row)
        ? { rows: rows.map((row) => ({ ...row, seen: true })), status: 'applied', issues: [] }
        : {
            rows,
            status: 'skipped',
            issues: [{ code: 'missing_fields', fields: [config.field], message: 'missing' }],
          },
    Editor: (() => null) as any,
  });

  const seriesStep = (
    seriesMethod: MultiSeriesTransformationInstance['seriesMethod']
  ): MultiSeriesTransformationInstance => ({
    instance_id: 'multi',
    definition_id: 'multi_step',
    config: {},
    hide: false,
    seriesMethod,
    Editor: (() => null) as any,
  });

  beforeEach(() => {
    service = new TransformationService();
  });

  afterEach(() => {
    service.destroy();
  });

  it('gives one series the same result as applyPipeline, without a Query column', () => {
    service.setPipeline([fieldStep('size')]);
    const fromSeries = service.applyPipelineToSeries([seriesA()]);
    const fromRows = service.applyPipeline(seriesA().rows, seriesA().fieldSchema);

    expect(fromSeries.rows).toEqual(fromRows.rows);
    expect(fromSeries.finalSchema).toEqual(fromRows.finalSchema);
    expect(fromSeries.steps).toEqual(fromRows.steps);
    expect(fromSeries.finalSchema.map(({ name }) => name)).not.toContain('Query');
  });

  it('merges several series at the end, tagging each row with its query', () => {
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(result.series).toHaveLength(2);
    expect(result.rows).toEqual([
      { size: 'S', value: 1, Query: 'A' },
      { cate: 'X', value: 2, Query: 'B' },
    ]);
    expect(result.finalSchema).toEqual([str('size'), num('value'), str('cate'), str('Query')]);
  });

  it('runs a single-series step without applyTo on the only series', () => {
    service.setPipeline([fieldStep('value')]);
    const result = service.applyPipelineToSeries([seriesA()]);

    expect(result.series[0].rows[0].seen).toBe(true);
    expect(result.steps[0]).toMatchObject({ status: 'applied', issues: [] });
  });

  it('waits for a query to be picked with several series and no applyTo', () => {
    service.setPipeline([fieldStep('value')]);
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(result.series.map(({ rows }) => rows[0].seen)).toEqual([undefined, undefined]);
    expect(result.steps[0]).toMatchObject({
      status: 'skipped',
      issues: [{ code: 'invalid_config' }],
    });
  });

  it('reports the picked series missing the field, though another series has it', () => {
    service.setPipeline([{ ...fieldStep('cate'), applyTo: 'A' }]);
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(result.series.map(({ rows }) => rows[0].seen)).toEqual([undefined, undefined]);
    expect(result.steps[0].status).toBe('skipped');
  });

  it('reports missing fields when the series has none of them', () => {
    service.setPipeline([fieldStep('nowhere')]);
    const result = service.applyPipelineToSeries([seriesA()]);

    expect(result.steps[0].status).toBe('skipped');
    expect(result.steps[0].issues).toEqual([
      { code: 'missing_fields', fields: ['nowhere'], message: 'missing' },
    ]);
  });

  it('gives a multi-series step every series, and merges no further once it returns one', () => {
    const seriesMethod = jest.fn((series: any[]) => ({
      series: [
        { refId: 'AB', rows: series.flatMap(({ rows }) => rows), fieldSchema: [num('value')] },
      ],
      status: 'applied' as const,
      issues: [],
    }));
    service.setPipeline([seriesStep(seriesMethod)]);
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(seriesMethod.mock.calls[0][0].map(({ refId }: any) => refId)).toEqual(['A', 'B']);
    expect(result.series).toHaveLength(1);
    expect(result.finalSchema.map(({ name }) => name)).not.toContain('Query');
  });

  it('skips a hidden multi-series step', () => {
    const seriesMethod = jest.fn();
    service.setPipeline([{ ...seriesStep(seriesMethod as any), hide: true }]);
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(seriesMethod).not.toHaveBeenCalled();
    expect(result.steps[0].status).toBe('skipped');
  });

  it('keeps the series when a multi-series step throws', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    service.setPipeline([
      seriesStep(() => {
        throw new Error('boom');
      }),
    ]);
    const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(result.series.map(({ refId }) => refId)).toEqual(['A', 'B']);
    expect(result.steps[0]).toMatchObject({
      status: 'failed',
      issues: [{ code: 'execution_error', message: 'boom' }],
    });
  });

  it("offers a single-series step the only series' fields without applyTo", () => {
    service.setPipeline([fieldStep('value')]);
    service.applyPipelineToSeries([seriesA()]);

    expect(service.stageFields$.getValue().get('step_value')).toEqual([str('size'), num('value')]);
  });

  it('offers no fields until a query is picked with several series', () => {
    service.setPipeline([fieldStep('value')]);
    service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(service.stageFields$.getValue().get('step_value')).toEqual([]);
    expect(service.stageRefIds$.getValue().get('step_value')).toEqual(['A', 'B']);
  });

  it("keeps a step on its picked query: hiding that query doesn't move it to another", () => {
    service.setPipeline([{ ...fieldStep('value'), applyTo: 'A' }]);
    const result = service.applyPipelineToSeries([
      seriesB(),
      oneSeries('C', [{ value: 3 }], [num('value')]),
    ]);

    expect(result.series.map(({ rows }) => rows[0].seen)).toEqual([undefined, undefined]);
    expect(result.steps[0].issues[0].code).toBe('missing_series');
    expect(service.stageFields$.getValue().get('step_value')).toEqual([]);
  });

  it("offers a multi-series step the union of its series' fields", () => {
    const step = seriesStep(
      jest.fn((series: any[]) => ({ series, status: 'applied', issues: [] }))
    );
    service.setPipeline([step]);
    service.applyPipelineToSeries([seriesA(), seriesB()]);

    expect(service.stageFields$.getValue().get(step.instance_id)).toEqual([
      str('size'),
      num('value'),
      str('cate'),
    ]);
  });

  describe('applyTo', () => {
    it('runs a single-series step only on the picked series', () => {
      service.setPipeline([{ ...fieldStep('value'), applyTo: 'B' }]);
      const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

      expect(result.series[0].rows).toEqual([{ size: 'S', value: 1 }]);
      expect(result.series[1].rows).toEqual([{ cate: 'X', value: 2, seen: true }]);
      expect(result.steps[0].status).toBe('applied');
    });

    it("offers the picked series' fields and every series's refIds", () => {
      service.setPipeline([{ ...fieldStep('value'), applyTo: 'B' }]);
      service.applyPipelineToSeries([seriesA(), seriesB()]);

      expect(service.stageFields$.getValue().get('step_value')).toEqual([
        str('cate'),
        num('value'),
      ]);
      expect(service.stageRefIds$.getValue().get('step_value')).toEqual(['A', 'B']);
    });

    it("is skipped with missing_series when the picked series isn't in the input", () => {
      service.setPipeline([{ ...fieldStep('value'), applyTo: 'C' }]);
      const result = service.applyPipelineToSeries([seriesA(), seriesB()]);

      expect(result.steps[0]).toMatchObject({
        status: 'skipped',
        issues: [{ code: 'missing_series' }],
      });
      expect(result.series.map(({ rows }) => rows[0].seen)).toEqual([undefined, undefined]);
    });

    it('is set by updateInstanceApplyTo and survives serialize / restore', () => {
      service.registerDefinition({
        id: 'field_step',
        type: 'filter',
        label: 'Field step',
        description: '',
        iconType: 'filter',
        createInstance: () => fieldStep('value'),
      });
      service.setPipeline([fieldStep('value')]);
      service.updateInstanceApplyTo('step_value', 'A');

      const serialized = service.serializePipeline();
      expect(serialized[0].applyTo).toBe('A');

      service.setPipeline([]);
      service.restoreFromState(serialized);
      expect(service.pipeline$.getValue()[0].applyTo).toBe('A');

      service.updateInstanceApplyTo(service.pipeline$.getValue()[0].instance_id, undefined);
      expect(service.serializePipeline()[0]).not.toHaveProperty('applyTo');
    });

    it('drops a non-string applyTo restored from the URL', () => {
      service.registerDefinition({
        id: 'field_step',
        type: 'filter',
        label: 'Field step',
        description: '',
        iconType: 'filter',
        createInstance: () => fieldStep('value'),
      });
      service.restoreFromState([
        { definitionId: 'field_step', config: {}, hide: false, applyTo: { x: 1 } as never },
      ]);
      expect(service.pipeline$.getValue()[0]).not.toHaveProperty('applyTo');
    });
  });
});
