/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject } from 'rxjs';
import { TransformationService, TRANSFORMATION_STATE_KEY } from './transformation_service';
import { TransformationDefinition, TransformationInstance, UrlTransformationState } from './types';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

const createMockDefinition = (
  id: string,
  transformFn?: (data: any[], config: any) => any[]
): TransformationDefinition => ({
  id,
  type: 'test',
  label: id,
  description: `${id} description`,
  iconType: 'empty',
  createInstance: () => ({
    instance_id: `instance_${id}_${Date.now()}`,
    definition_id: id,
    config: {},
    hide: false,
    transformationMethod: transformFn || ((data) => data),
    Editor: (() => null) as any,
  }),
});

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
      const schema = [{ name: 'a', type: 'integer' }];
      const { rows: result, finalSchema } = service.applyPipeline(rows, schema);
      expect(result).toEqual(rows);
      expect(finalSchema).toEqual(schema);
    });

    it('applies transformation to rows', () => {
      const limitDef = createMockDefinition('limit', (data, config) => data.slice(0, config.limit));
      service.registerDefinition(limitDef);
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.updateInstanceConfig(instanceId, { limit: 1 });

      const rows = [createHit({ a: 1 }), createHit({ a: 2 }), createHit({ a: 3 })];
      const { rows: result } = service.applyPipeline(rows);
      expect(result).toHaveLength(1);
    });

    it('skips hidden instances', () => {
      const limitDef = createMockDefinition('limit', (data, config) => data.slice(0, config.limit));
      service.registerDefinition(limitDef);
      service.addInstance('limit');
      const instanceId = service.pipeline$.getValue()[0].instance_id;
      service.updateInstanceConfig(instanceId, { limit: 1 });
      service.toggleInstanceHide(instanceId);

      const rows = [createHit({ a: 1 }), createHit({ a: 2 })];
      const { rows: result } = service.applyPipeline(rows);
      expect(result).toHaveLength(2);
    });

    it('applies multiple transformations in order', () => {
      const addFieldDef: TransformationDefinition = {
        id: 'add_field',
        type: 'transform',
        label: 'Add Field',
        description: '',
        iconType: '',
        createInstance: () => ({
          instance_id: `instance_add_${Date.now()}`,
          definition_id: 'add_field',
          config: {},
          hide: false,
          transformationMethod: (data) =>
            data.map((row) => ({
              ...row,
              _source: { ...(row._source as Record<string, unknown>), added: true },
            })),
          Editor: (() => null) as any,
        }),
      };
      const limitDef = createMockDefinition('limit', (data) => data.slice(0, 1));

      service.registerDefinition(addFieldDef);
      service.registerDefinition(limitDef);
      service.addInstance('add_field');
      service.addInstance('limit');

      const rows = [createHit({ a: 1 }), createHit({ a: 2 })];
      const { rows: result } = service.applyPipeline(rows);
      expect(result).toHaveLength(1);
      expect((result[0]._source as Record<string, unknown>).added).toBe(true);
    });

    it('calls validateConfig and updates pipeline if config changes', () => {
      const def: TransformationDefinition = {
        id: 'validated',
        type: 'test',
        label: 'Validated',
        description: '',
        iconType: '',
        createInstance: () => ({
          instance_id: `instance_validated_${Date.now()}`,
          definition_id: 'validated',
          config: { field: 'removed' },
          hide: false,
          transformationMethod: (data) => data,
          validateConfig: (config: any, fields: any[]) => {
            const fieldNames = new Set(fields.map((f) => f.name));
            if (config.field && !fieldNames.has(config.field)) {
              return { ...config, field: undefined };
            }
            return config;
          },
          Editor: (() => null) as any,
        }),
      };
      service.registerDefinition(def);
      service.addInstance('validated');

      const rows = [createHit({ name: 'Alice' })];
      const schema = [{ name: 'name', type: 'keyword' }];
      service.applyPipeline(rows, schema);

      expect(service.pipeline$.getValue()[0].config).toEqual({ field: undefined });
    });
  });

  describe('restoreFromState', () => {
    it('restores pipeline from URL state', () => {
      service.registerDefinition(createMockDefinition('limit'));
      service.restoreFromState([{ definitionId: 'limit', config: { limit: 5 }, hide: false }]);
      expect(service.pipeline$.getValue()).toHaveLength(1);
      expect(service.pipeline$.getValue()[0].config).toEqual({ limit: 5 });
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

    it('does nothing for null/undefined input', () => {
      service.restoreFromState(null as any);
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

  describe('initUrlSync - URL change listening', () => {
    const createUrlStorage = (initialStates: UrlTransformationState[] = []) => {
      const subject = new Subject<UrlTransformationState[]>();
      let stored: UrlTransformationState[] = initialStates;
      const storage = {
        get: jest.fn((key: string) => (key === TRANSFORMATION_STATE_KEY ? stored : null)),
        set: jest.fn((_key: string, value: UrlTransformationState[]) => {
          stored = value;
          return Promise.resolve(undefined);
        }),
        change$: jest.fn(() => subject.asObservable()),
        cancel: jest.fn(),
        flush: jest.fn(),
      };
      return { storage, subject, setStored: (v: UrlTransformationState[]) => (stored = v) };
    };

    it('skips restore when URL _t has not actually changed', () => {
      service.registerDefinition(createMockDefinition('filter'));
      const states: UrlTransformationState[] = [
        { definitionId: 'filter', config: {}, hide: false },
      ];
      const { storage, subject, setStored } = createUrlStorage(states);
      service.initUrlSync(storage as any);

      const restoreSpy = jest.spyOn(service, 'restoreFromState');
      setStored(states);
      subject.next(states);

      expect(restoreSpy).not.toHaveBeenCalled();
    });

    it('proceeds when URL _t actually changes', () => {
      service.registerDefinition(createMockDefinition('filter'));
      const initial: UrlTransformationState[] = [];
      const { storage, subject, setStored } = createUrlStorage(initial);
      service.initUrlSync(storage as any);

      const restoreSpy = jest.spyOn(service, 'restoreFromState');
      const newStates: UrlTransformationState[] = [
        { definitionId: 'filter', config: {}, hide: false },
      ];
      setStored(newStates);
      subject.next(newStates);

      expect(restoreSpy).toHaveBeenCalledWith(newStates);
    });

    it('skips restore when URL matches current pipeline state', () => {
      service.registerDefinition(createMockDefinition('filter'));
      service.addInstance('filter');

      const currentStates: UrlTransformationState[] = service.pipeline$.getValue().map((inst) => ({
        definitionId: inst.definition_id,
        config: inst.config,
        hide: inst.hide,
      }));

      const { storage, subject, setStored } = createUrlStorage(currentStates);
      service.initUrlSync(storage as any);

      const restoreSpy = jest.spyOn(service, 'restoreFromState');

      // URL changes to same logical state (simulates self-write from persistToUrl)
      const sameStates: UrlTransformationState[] = currentStates.map((s) => ({ ...s }));
      setStored(sameStates);
      subject.next(sameStates);

      expect(restoreSpy).not.toHaveBeenCalled();
    });

    it('clears pipeline when URL _t becomes empty', () => {
      service.registerDefinition(createMockDefinition('filter'));
      const initial: UrlTransformationState[] = [
        { definitionId: 'filter', config: {}, hide: false },
      ];
      const { storage, subject, setStored } = createUrlStorage(initial);
      service.initUrlSync(storage as any);
      service.addInstance('filter');

      setStored([]);
      subject.next([]);

      expect(service.pipeline$.getValue()).toHaveLength(0);
    });
  });
});
