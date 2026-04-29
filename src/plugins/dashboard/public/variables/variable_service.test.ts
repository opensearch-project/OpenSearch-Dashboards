/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariableService } from './variable_service';
import { Variable, VariableType, VariableSortOrder, CustomVariable, QueryVariable } from './types';

jest.mock('./variable_query_utils', () => ({
  ...jest.requireActual('./variable_query_utils'),
  executeQueryForOptions: jest.fn(),
}));

import { executeQueryForOptions } from './variable_query_utils';
const mockExecuteQuery = executeQueryForOptions as jest.Mock;

function createService(initialVariables: Variable[] = [], dashboardId?: string) {
  const mockSavedObjectsClient = {
    update: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({ attributes: {} }),
  };

  const service = new VariableService(
    {} as any, // dataPlugin
    dashboardId,
    mockSavedObjectsClient as any
  );

  service.initialize(initialVariables);

  return { service, mockSavedObjectsClient };
}

function makeCustomVariable(overrides: Partial<CustomVariable> = {}): CustomVariable {
  return {
    id: 'custom-1',
    name: 'env',
    type: VariableType.Custom,
    current: ['dev'],
    customOptions: ['dev', 'staging', 'prod'],
    ...overrides,
  };
}

// Helper function to get variables with state synchronously
function getVariablesWithState(service: VariableService) {
  let result: any[] = [];
  service
    .getVariables$()
    .subscribe((vars) => {
      result = vars;
    })
    .unsubscribe();
  return result;
}

// Helper function to get current values
function getCurrentValues(service: VariableService): Record<string, string[]> {
  const variables = service.getVariables();
  const values: Record<string, string[]> = {};
  variables.forEach((v) => {
    values[v.name] = v.current ?? [];
  });
  return values;
}

function makeQueryVariable(overrides: Partial<QueryVariable> = {}): QueryVariable {
  return {
    id: 'query-1',
    name: 'service',
    type: VariableType.Query,
    current: ['api'],
    query: 'source=logs | dedup service | fields service',
    language: 'PPL',
    ...overrides,
  };
}

describe('VariableService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize and getVariables', () => {
    it('should return empty array when not initialized', () => {
      const service = new VariableService();
      expect(service.getVariables()).toEqual([]);
    });

    it('should return variables after initialization', () => {
      const vars = [makeCustomVariable()];
      const { service } = createService(vars);
      expect(service.getVariables()).toEqual(vars);
    });

    it('should return observable of variables', (done) => {
      const vars = [makeCustomVariable()];
      const { service } = createService(vars);
      service.getVariables$().subscribe((variables) => {
        expect(variables[0].name).toBe('env');
        done();
      });
    });
  });

  describe('getVariablesWithState', () => {
    it('should merge runtime state with persisted variables', () => {
      const { service } = createService([makeCustomVariable()]);
      const vars = getVariablesWithState(service);
      expect(vars[0].options).toEqual(['dev', 'staging', 'prod']);
      expect(vars[0].name).toBe('env');
    });
  });

  describe('getCurrentValues', () => {
    it('should return name-value map', () => {
      const { service } = createService([makeCustomVariable(), makeQueryVariable()]);
      expect(getCurrentValues(service)).toEqual({ env: ['dev'], service: ['api'] });
    });

    it('should return empty array for undefined current', () => {
      const { service } = createService([makeCustomVariable({ current: undefined })]);
      expect(getCurrentValues(service)).toEqual({ env: [] });
    });
  });

  describe('addVariable — Custom', () => {
    it('should add a custom variable with derived options', async () => {
      const { service } = createService([], 'dashboard-123');

      await service.addVariable({
        name: 'env',
        type: VariableType.Custom,
        customOptions: ['dev', 'staging', 'prod'],
      } as any);

      const vars = service.getVariables();
      expect(vars).toHaveLength(1);
      expect(vars[0].name).toBe('env');
      expect(vars[0].current).toEqual(['dev']);

      // Options are in runtime state, not persisted
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('addVariable — Query', () => {
    it('should add a query variable and trigger refresh', async () => {
      mockExecuteQuery.mockResolvedValue(['api', 'web', 'worker']);
      const { service } = createService([], 'dashboard-123');

      await service.addVariable({
        name: 'service',
        type: VariableType.Query,
        query: 'source=logs | dedup service | fields service',
        language: 'PPL',
      } as any);

      const vars = service.getVariables();
      expect(vars).toHaveLength(1);
      expect(vars[0].current).toEqual(['api']);
      expect(mockExecuteQuery).toHaveBeenCalled();

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['api', 'web', 'worker']);
    });
  });

  describe('updateVariable — same type', () => {
    it('should update label without touching current', async () => {
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', { label: 'Environment' });

      const updated = service.getVariables()[0];
      expect(updated.label).toBe('Environment');
      expect(updated.current).toEqual(['dev']);
    });

    it('should re-derive options when customOptions changes', async () => {
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', { customOptions: ['alpha', 'beta'] } as any);

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['alpha', 'beta']);
      expect(withState[0].current).toEqual(['alpha']);
    });

    it('should preserve current if still valid after customOptions change', async () => {
      const { service } = createService(
        [makeCustomVariable({ current: ['staging'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', {
        customOptions: ['dev', 'staging', 'new'],
      } as any);

      const withState = getVariablesWithState(service);
      expect(withState[0].current).toEqual(['staging']);
    });

    it('should not re-derive options when customOptions is unchanged', async () => {
      const { service } = createService(
        [makeCustomVariable({ current: ['staging'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', {
        customOptions: ['dev', 'staging', 'prod'],
      } as any);

      const withState = getVariablesWithState(service);
      expect(withState[0].current).toEqual(['staging']);
    });

    it('should trim current to first value when switching from multi to single', async () => {
      const { service } = createService(
        [makeCustomVariable({ multi: true, current: ['dev', 'staging', 'prod'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', { multi: false });

      const updated = service.getVariables()[0];
      expect(updated.multi).toBe(false);
      expect(updated.current).toEqual(['dev']);
    });

    it('should keep current as-is when switching from single to multi', async () => {
      const { service } = createService(
        [makeCustomVariable({ multi: false, current: ['dev'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', { multi: true });

      const updated = service.getVariables()[0];
      expect(updated.multi).toBe(true);
      expect(updated.current).toEqual(['dev']);
    });
  });

  describe('updateVariable — type switch', () => {
    it('should strip query fields when switching from Query to Custom', async () => {
      const { service } = createService([makeQueryVariable()], 'dashboard-123');

      await service.updateVariable('query-1', {
        type: VariableType.Custom,
        customOptions: ['a', 'b', 'c'],
      } as any);

      const updated = service.getVariables()[0];
      expect(updated.type).toBe(VariableType.Custom);
      expect((updated as CustomVariable).customOptions).toEqual(['a', 'b', 'c']);
      expect(updated.current).toEqual(['a']);
      expect((updated as any).query).toBeUndefined();
      expect((updated as any).language).toBeUndefined();
    });

    it('should strip custom fields when switching from Custom to Query', async () => {
      mockExecuteQuery.mockResolvedValue(['x', 'y']);
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', {
        type: VariableType.Query,
        query: 'source=test',
        language: 'PPL',
      } as any);

      const updated = service.getVariables()[0];
      expect(updated.type).toBe(VariableType.Query);
      expect((updated as any).customOptions).toBeUndefined();
      expect(mockExecuteQuery).toHaveBeenCalled();
    });
  });

  describe('updateVariable — errors', () => {
    it('should throw for unknown id', async () => {
      const { service } = createService([makeCustomVariable()]);
      await expect(service.updateVariable('nonexistent', {})).rejects.toThrow('not found');
    });
  });

  describe('removeVariable', () => {
    it('should remove a variable by id', async () => {
      const { service } = createService(
        [makeCustomVariable(), makeQueryVariable()],
        'dashboard-123'
      );
      await service.removeVariable('custom-1');
      expect(service.getVariables()).toHaveLength(1);
      expect(service.getVariables()[0].id).toBe('query-1');
    });

    it('should not remove variable if save fails', async () => {
      const { service, mockSavedObjectsClient } = createService(
        [makeCustomVariable(), makeQueryVariable()],
        'dashboard-123'
      );
      mockSavedObjectsClient.update.mockRejectedValueOnce(new Error('Save failed'));

      await expect(service.removeVariable('custom-1')).rejects.toThrow('Save failed');

      // Variables should still have both items
      expect(service.getVariables()).toHaveLength(2);
    });
  });

  describe('updateVariableValue', () => {
    it('should update the current value', () => {
      const { service } = createService([makeCustomVariable()]);
      service.updateVariableValue('custom-1', ['prod']);
      expect(service.getVariables()[0].current).toEqual(['prod']);
    });

    it('should throw for unknown id', () => {
      const { service } = createService([makeCustomVariable()]);
      expect(() => service.updateVariableValue('nonexistent', ['x'])).toThrow('not found');
    });

    it('should refresh dependent query variables', async () => {
      mockExecuteQuery.mockResolvedValue(['svc-a', 'svc-b']);
      const region = makeCustomVariable({ id: 'region-1', name: 'region', current: ['us-east'] });
      const svc = makeQueryVariable({
        id: 'service-1',
        name: 'service',
        query: "source=logs | where region = '${region}' | dedup service | fields service",
      });
      const { service } = createService([region, svc]);

      service.updateVariableValue('region-1', ['eu-west']);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockExecuteQuery).toHaveBeenCalled();
    });

    it('should not refresh variables that do not reference the changed variable', async () => {
      const env = makeCustomVariable({ id: 'env-1', name: 'env', current: ['dev'] });
      const svc = makeQueryVariable({
        id: 'service-1',
        name: 'service',
        query: 'source=logs | dedup service | fields service',
      });
      const { service } = createService([env, svc]);

      service.updateVariableValue('env-1', ['prod']);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockExecuteQuery).not.toHaveBeenCalled();
    });
  });

  describe('reorderVariables', () => {
    it('should swap variable positions', () => {
      const v1 = makeCustomVariable({ id: '1', name: 'a' });
      const v2 = makeCustomVariable({ id: '2', name: 'b' });
      const { service } = createService([v1, v2]);
      service.reorderVariables(0, 1);
      const vars = service.getVariables();
      expect(vars[0].id).toBe('2');
      expect(vars[1].id).toBe('1');
    });
  });

  describe('refreshVariableOptions', () => {
    it('should update options and preserve valid current', async () => {
      mockExecuteQuery.mockResolvedValue(['api', 'web', 'new-svc']);
      const { service } = createService([makeQueryVariable({ current: ['api'] })]);

      await service.refreshVariableOptions('query-1');

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['api', 'web', 'new-svc']);
      expect(withState[0].current).toEqual(['api']);
      expect(withState[0].loading).toBe(false);
    });

    it('should fall back to first option when current is no longer valid', async () => {
      mockExecuteQuery.mockResolvedValue(['new-a', 'new-b']);
      const { service } = createService([makeQueryVariable({ current: ['old-value'] })]);

      await service.refreshVariableOptions('query-1');
      expect(service.getVariables()[0].current).toEqual(['new-a']);
    });

    it('should set error state on fetch failure', async () => {
      mockExecuteQuery.mockRejectedValue(new Error('Network error'));
      const { service } = createService([makeQueryVariable()]);

      await service.refreshVariableOptions('query-1');

      const withState = getVariablesWithState(service);
      expect(withState[0].loading).toBe(false);
      expect(withState[0].error).toBe('Network error');
    });

    it('should silently ignore AbortError', async () => {
      mockExecuteQuery.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      const { service } = createService([makeQueryVariable()]);

      await service.refreshVariableOptions('query-1');

      const withState = getVariablesWithState(service);
      expect(withState[0].error).toBeUndefined();
    });

    it('should abort previous request when called again for same variable', async () => {
      let callCount = 0;
      mockExecuteQuery.mockImplementation((_dp: any, _params: any, signal?: AbortSignal) => {
        callCount++;
        return new Promise((resolve, reject) => {
          const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
          if (signal?.aborted) return onAbort();
          signal?.addEventListener('abort', onAbort);
          setTimeout(() => resolve([`result-${callCount}`]), 50);
        });
      });

      const { service } = createService([makeQueryVariable()]);

      const first = service.refreshVariableOptions('query-1');
      const second = service.refreshVariableOptions('query-1');
      await Promise.all([first, second]);

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['result-2']);
    });

    it('should skip non-query variables', async () => {
      const { service } = createService([makeCustomVariable()]);
      await service.refreshVariableOptions('custom-1');
      expect(mockExecuteQuery).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clear runtime state and abort pending requests', () => {
      const { service } = createService([makeCustomVariable()]);

      // Before destroy, we should be able to get variables
      expect(service.getVariables()).toHaveLength(1);

      service.destroy();

      // After destroy, variables snapshot is still available
      // but the observables are completed and can't emit new values
      expect(service.getVariables()).toHaveLength(1);
    });
  });

  describe('setInterpolationService — chained variables', () => {
    it('should interpolate variable references in query before fetching options', async () => {
      mockExecuteQuery.mockResolvedValue(['svc-a', 'svc-b']);
      const region = makeCustomVariable({ id: 'region-1', name: 'region', current: ['us-east'] });
      const svc = makeQueryVariable({
        id: 'service-1',
        name: 'service',
        query: "source=logs | where region = '${region}' | dedup service | fields service",
      });
      const { service } = createService([region, svc]);
      service.setInterpolationService({
        hasVariables: (q: string) => /\$\{\w+\}|\$\w+/.test(q),
        interpolate: (q: string) =>
          q.replace(/\$\{region\}/g, 'us-east').replace(/\$region\b/g, 'us-east'),
        getCurrentValues: () => ({ region: 'us-east' }),
        getVariables: () => [{ name: 'region', value: 'us-east' }],
      });

      await service.refreshVariableOptions('service-1');

      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          query: "source=logs | where region = 'us-east' | dedup service | fields service",
        }),
        expect.anything()
      );
    });
  });

  describe('refreshAllVariableOptions — sequential execution', () => {
    it('should refresh variables sequentially', async () => {
      const callOrder: string[] = [];
      mockExecuteQuery.mockImplementation((_dp: any, params: any) => {
        callOrder.push(params.query);
        return Promise.resolve(['result']);
      });

      const v1 = makeQueryVariable({ id: 'q1', name: 'first', query: 'query-1' });
      const v2 = makeQueryVariable({ id: 'q2', name: 'second', query: 'query-2' });
      const { service } = createService([v1, v2]);

      await service.refreshAllVariableOptions();
      expect(callOrder).toEqual(['query-1', 'query-2']);
    });
  });

  describe('sort options', () => {
    it('should sort custom variable options alphabetically ascending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['cherry', 'apple', 'banana'],
          sort: VariableSortOrder.AlphabeticalAsc,
        }),
      ]);
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should sort custom variable options alphabetically descending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['cherry', 'apple', 'banana'],
          sort: VariableSortOrder.AlphabeticalDesc,
        }),
      ]);
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['cherry', 'banana', 'apple']);
    });

    it('should sort numerically ascending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['10', '2', '100', '1'],
          sort: VariableSortOrder.NumericalAsc,
        }),
      ]);
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['1', '2', '10', '100']);
    });

    it('should sort numerically descending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['10', '2', '100', '1'],
          sort: VariableSortOrder.NumericalDesc,
        }),
      ]);
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['100', '10', '2', '1']);
    });

    it('should not sort when sort is disabled', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['cherry', 'apple', 'banana'],
          sort: VariableSortOrder.Disabled,
        }),
      ]);
      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['cherry', 'apple', 'banana']);
    });

    it('should sort query variable options after refresh', async () => {
      mockExecuteQuery.mockResolvedValue(['zebra', 'apple', 'mango']);
      const { service } = createService([
        makeQueryVariable({ sort: VariableSortOrder.AlphabeticalAsc }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['apple', 'mango', 'zebra']);
    });

    it('should re-sort options when sort setting changes', async () => {
      const { service } = createService(
        [
          makeCustomVariable({
            customOptions: ['cherry', 'apple', 'banana'],
            sort: VariableSortOrder.Disabled,
          }),
        ],
        'dashboard-123'
      );

      // Initialize runtime state by getting variables with state first
      getVariablesWithState(service);

      await service.updateVariable('custom-1', { sort: VariableSortOrder.AlphabeticalAsc });

      const withState = getVariablesWithState(service);
      expect(withState[0].options).toEqual(['apple', 'banana', 'cherry']);
    });
  });

  describe('toggleVariableHide', () => {
    it('should toggle hide property in memory without saving', () => {
      const { service, mockSavedObjectsClient } = createService([
        makeCustomVariable({ hide: false }),
      ]);

      service.toggleVariableHide('custom-1');

      const updated = service.getVariables()[0];
      expect(updated.hide).toBe(true);
      expect(mockSavedObjectsClient.update).not.toHaveBeenCalled();
    });

    it('should toggle from hidden to visible', () => {
      const { service } = createService([makeCustomVariable({ hide: true })]);

      service.toggleVariableHide('custom-1');

      const updated = service.getVariables()[0];
      expect(updated.hide).toBe(false);
    });
  });

  describe('save failure rollback', () => {
    it('should rollback when addVariable save fails', async () => {
      const { service, mockSavedObjectsClient } = createService([], 'dashboard-123');
      mockSavedObjectsClient.update.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.addVariable({
          name: 'test',
          type: VariableType.Custom,
          customOptions: ['a', 'b'],
        } as any)
      ).rejects.toThrow('Network error');

      // Should not add the variable
      expect(service.getVariables()).toHaveLength(0);
    });

    it('should rollback when updateVariable save fails', async () => {
      const { service, mockSavedObjectsClient } = createService(
        [makeCustomVariable({ label: 'Original' })],
        'dashboard-123'
      );
      mockSavedObjectsClient.update.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.updateVariable('custom-1', { label: 'Updated' })).rejects.toThrow(
        'Network error'
      );

      // Should keep original label
      const variable = service.getVariables()[0];
      expect(variable.label).toBe('Original');
    });

    it('should rollback runtime state when updateVariable with customOptions fails', async () => {
      const { service, mockSavedObjectsClient } = createService(
        [makeCustomVariable({ customOptions: ['dev', 'staging', 'prod'] })],
        'dashboard-123'
      );
      mockSavedObjectsClient.update.mockRejectedValueOnce(new Error('Network error'));

      const originalState = getVariablesWithState(service)[0];

      await expect(
        service.updateVariable('custom-1', { customOptions: ['alpha', 'beta'] } as any)
      ).rejects.toThrow('Network error');

      // Runtime state should not change
      const currentState = getVariablesWithState(service)[0];
      expect(currentState.options).toEqual(originalState.options);
    });
  });

  describe('runtimeStateChange$ observable', () => {
    it('should trigger when addVariable succeeds', async () => {
      const { service } = createService([], 'dashboard-123');
      const emissions: any[] = [];

      service.getVariables$().subscribe((vars) => {
        emissions.push(vars);
      });

      await service.addVariable({
        name: 'test',
        type: VariableType.Custom,
        customOptions: ['a', 'b'],
      } as any);

      // Should have initial emission + emission after add
      expect(emissions.length).toBeGreaterThan(1);
      expect(emissions[emissions.length - 1][0].options).toEqual(['a', 'b']);
    });

    it('should trigger when updateVariable changes runtime state', async () => {
      const { service } = createService(
        [makeCustomVariable({ customOptions: ['dev', 'staging', 'prod'] })],
        'dashboard-123'
      );
      const emissions: any[] = [];

      service.getVariables$().subscribe((vars) => {
        emissions.push(vars);
      });

      const initialEmissions = emissions.length;

      await service.updateVariable('custom-1', { customOptions: ['alpha', 'beta'] } as any);

      // Should emit after update
      expect(emissions.length).toBeGreaterThan(initialEmissions);
      expect(emissions[emissions.length - 1][0].options).toEqual(['alpha', 'beta']);
    });

    it('should trigger when removeVariable succeeds', async () => {
      const { service } = createService([makeCustomVariable()], 'dashboard-123');
      const emissions: any[] = [];

      service.getVariables$().subscribe((vars) => {
        emissions.push(vars);
      });

      const initialEmissions = emissions.length;

      await service.removeVariable('custom-1');

      // Should emit after remove
      expect(emissions.length).toBeGreaterThan(initialEmissions);
      expect(emissions[emissions.length - 1]).toHaveLength(0);
    });
  });

  describe('initializeFromDashboard', () => {
    it('should load variables from dashboard saved object', async () => {
      const mockVariables = [
        makeCustomVariable({ id: 'var-1', name: 'region' }),
        makeCustomVariable({ id: 'var-2', name: 'env' }),
      ];

      const mockSavedObjectsClient = {
        update: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({
          attributes: {
            variablesJSON: JSON.stringify({ variables: mockVariables }),
          },
        }),
      };

      const service = new VariableService(
        {} as any,
        'dashboard-123',
        mockSavedObjectsClient as any
      );

      await service.initializeFromDashboard();

      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('dashboard', 'dashboard-123');
      expect(service.getVariables()).toEqual(mockVariables);
    });

    it('should handle empty variablesJSON', async () => {
      const mockSavedObjectsClient = {
        update: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({
          attributes: {},
        }),
      };

      const service = new VariableService(
        {} as any,
        'dashboard-123',
        mockSavedObjectsClient as any
      );

      await service.initializeFromDashboard();

      expect(service.getVariables()).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockSavedObjectsClient = {
        update: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockRejectedValue(new Error('Dashboard not found')),
      };

      const service = new VariableService(
        {} as any,
        'dashboard-123',
        mockSavedObjectsClient as any
      );

      await service.initializeFromDashboard();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[VariableService] Failed to load variables from dashboard:',
        expect.any(Error)
      );
      expect(service.getVariables()).toEqual([]);

      consoleSpy.mockRestore();
    });
  });
});
