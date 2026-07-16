/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VariableService } from './variable_service';
import { Variable, VariableType, VariableSortOrder, CustomVariable, QueryVariable } from './types';
import { VariableInterpolationService } from './variable_interpolation_service';

jest.mock('./variable_query_utils', () => ({
  ...jest.requireActual('./variable_query_utils'),
  executeVariableQuery: jest.fn(),
}));

import { executeVariableQuery } from './variable_query_utils';
const mockExecuteVariableQuery = executeVariableQuery as jest.Mock;

function makeQueryResult(
  values: unknown[],
  field: string = 'service',
  optionType: 'string' | 'number' | 'boolean' = 'string'
) {
  return values.length > 0
    ? {
        rows: values.map((value) => ({ [field]: value })),
        fields: [field],
        fieldTypes: { [field]: optionType },
      }
    : { rows: [], fields: [], fieldTypes: {} };
}

// Set default mock to return an empty query result
mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([]));

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

function getOptionValues(options: Array<{ value: string }>): string[] {
  return options.map((option) => option.value);
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
      const vars = service.getVariablesWithState();
      expect(vars[0].options).toEqual([{ value: 'dev' }, { value: 'staging' }, { value: 'prod' }]);
      expect(vars[0].name).toBe('env');
    });

    it('should derive custom option labels from object options', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: [
            { value: 'dev', label: 'Development' },
            { value: 'prod', label: 'Production' },
          ],
        }),
      ]);

      const vars = service.getVariablesWithState();
      expect(vars[0].options).toEqual([
        { value: 'dev', label: 'Development' },
        { value: 'prod', label: 'Production' },
      ]);
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
      expect((vars[0] as CustomVariable).customOptions).toEqual([
        { value: 'dev' },
        { value: 'staging' },
        { value: 'prod' },
      ]);

      // Options are in runtime state, not persisted
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['dev', 'staging', 'prod']);
    });

    it('should persist normalized custom option objects', async () => {
      const { service, mockSavedObjectsClient } = createService([], 'dashboard-123');

      await service.addVariable({
        name: 'region',
        type: VariableType.Custom,
        customOptions: [{ value: 'us-east-1', label: 'US East' }, 'us-west-2'],
      } as any);

      const [{ variablesJSON }] = mockSavedObjectsClient.update.mock.calls[0].slice(2);
      const parsed = JSON.parse(variablesJSON);
      expect(parsed.variables[0].customOptions).toEqual([
        { value: 'us-east-1', label: 'US East' },
        { value: 'us-west-2' },
      ]);
    });
  });

  describe('addVariable — Query', () => {
    it('should add a query variable and trigger refresh', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['api', 'web', 'worker']));
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
      expect(mockExecuteVariableQuery).toHaveBeenCalled();

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: 'api' },
        { value: 'web' },
        { value: 'worker' },
      ]);
    });
  });

  describe('updateVariable — same type', () => {
    it('should update label without touching current', async () => {
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', { label: 'Environment' });

      const updated = service.getVariables()[0];
      expect(updated.label).toBe('Environment');
      expect(updated.current).toEqual(['dev']);
      expect((updated as CustomVariable).customOptions).toEqual([
        { value: 'dev' },
        { value: 'staging' },
        { value: 'prod' },
      ]);
    });

    it('should re-derive options when customOptions changes', async () => {
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', { customOptions: ['alpha', 'beta'] } as any);

      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['alpha', 'beta']);
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

      const withState = service.getVariablesWithState();
      expect(withState[0].current).toEqual(['staging']);
    });

    it('should preserve current by value when custom option labels change', async () => {
      const { service } = createService(
        [
          makeCustomVariable({
            current: ['us-west-2'],
            customOptions: [
              { value: 'us-east-1', label: 'US East' },
              { value: 'us-west-2', label: 'US West' },
            ],
          }),
        ],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', {
        customOptions: [
          { value: 'us-east-1', label: 'US East 1' },
          { value: 'us-west-2', label: 'US West 2' },
        ],
      } as any);

      const withState = service.getVariablesWithState();
      expect(withState[0].current).toEqual(['us-west-2']);
      expect(withState[0].options).toEqual([
        { value: 'us-east-1', label: 'US East 1' },
        { value: 'us-west-2', label: 'US West 2' },
      ]);
    });

    it('should reset invalid current by value even when labels match', async () => {
      const { service } = createService(
        [
          makeCustomVariable({
            current: ['old-value'],
            customOptions: [{ value: 'old-value', label: 'Shared label' }],
          }),
        ],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', {
        customOptions: [{ value: 'new-value', label: 'Shared label' }],
      } as any);

      const withState = service.getVariablesWithState();
      expect(withState[0].current).toEqual(['new-value']);
    });

    it('should preserve current when customOptions values are unchanged', async () => {
      const { service } = createService(
        [makeCustomVariable({ current: ['staging'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', {
        customOptions: ['dev', 'staging', 'prod'],
      } as any);

      const withState = service.getVariablesWithState();
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

    it('should fall back to first option when custom options change and current is invalid', async () => {
      const { service } = createService(
        [makeCustomVariable({ customOptions: ['old-a', 'old-b'], current: ['old-a'] })],
        'dashboard-123'
      );

      await service.updateVariable('custom-1', { customOptions: ['new-x', 'new-y', 'new-z'] });

      const updated = service.getVariables()[0];
      expect((updated as CustomVariable).customOptions).toEqual([
        { value: 'new-x' },
        { value: 'new-y' },
        { value: 'new-z' },
      ]);
      // For Custom variables, should fall back to first option when current is invalid
      expect(updated.current).toEqual(['new-x']);
    });

    it('should refresh query options when valueField changes', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [{ service_id: 'svc-1', service_name: 'API service' }],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService(
        [
          makeQueryVariable({
            current: ['svc-1'],
            valueField: 'service_id',
          }),
        ],
        'dashboard-123'
      );

      await service.updateVariable('query-1', { valueField: 'service_name' });

      expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
      expect(service.getVariablesWithState()[0].options).toEqual([{ value: 'API service' }]);
    });

    it('should refresh query option labels when labelField changes', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [{ service_id: 'svc-1', service_name: 'API service' }],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService(
        [
          makeQueryVariable({
            current: ['svc-1'],
            valueField: 'service_id',
          }),
        ],
        'dashboard-123'
      );

      await service.updateVariable('query-1', { labelField: 'service_name' });

      expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
      expect(service.getVariablesWithState()[0].options).toEqual([
        { value: 'svc-1', label: 'API service' },
      ]);
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
      expect((updated as CustomVariable).customOptions).toEqual([
        { value: 'a' },
        { value: 'b' },
        { value: 'c' },
      ]);
      expect(updated.current).toEqual(['a']);
      expect((updated as any).query).toBeUndefined();
      expect((updated as any).language).toBeUndefined();
    });

    it('should strip custom fields when switching from Custom to Query', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['x', 'y']));
      const { service } = createService([makeCustomVariable()], 'dashboard-123');

      await service.updateVariable('custom-1', {
        type: VariableType.Query,
        query: 'source=test',
        language: 'PPL',
      } as any);

      const updated = service.getVariables()[0];
      expect(updated.type).toBe(VariableType.Query);
      expect((updated as any).customOptions).toBeUndefined();
      expect(mockExecuteVariableQuery).toHaveBeenCalled();
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

    it('should use empty string when removing last variable', async () => {
      const { service, mockSavedObjectsClient } = createService(
        [makeCustomVariable()],
        'dashboard-123'
      );
      await service.removeVariable('custom-1');

      expect(service.getVariables()).toHaveLength(0);
      // Verify that empty string (not undefined) was passed to savedObjectsClient.update
      // This ensures the variablesJSON field is cleared from the saved object
      expect(mockSavedObjectsClient.update).toHaveBeenCalledWith('dashboard', 'dashboard-123', {
        variablesJSON: '',
      });
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
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['svc-a', 'svc-b']));
      const region = makeCustomVariable({ id: 'region-1', name: 'region', current: ['us-east'] });
      const svc = makeQueryVariable({
        id: 'service-1',
        name: 'service',
        query: "source=logs | where region = '${region}' | dedup service | fields service",
      });
      const { service } = createService([region, svc]);

      service.updateVariableValue('region-1', ['eu-west']);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockExecuteVariableQuery).toHaveBeenCalled();
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
      expect(mockExecuteVariableQuery).not.toHaveBeenCalled();
    });

    it('should only refresh variables that come after the changed variable', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['host-a', 'host-b']));

      // Variable order: varB (depends on varA), varA, varC (depends on varA)
      const varB = makeQueryVariable({
        id: 'var-b',
        name: 'varB',
        query: "source=logs | where field = '${varA}' | dedup host | fields host",
      });
      const varA = makeCustomVariable({ id: 'var-a', name: 'varA', current: ['value1'] });
      const varC = makeQueryVariable({
        id: 'var-c',
        name: 'varC',
        query: "source=logs | where field = '${varA}' | dedup service | fields service",
      });
      const { service } = createService([varB, varA, varC]);

      mockExecuteVariableQuery.mockClear();
      service.updateVariableValue('var-a', ['value2']);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // varC should be refreshed (after varA), but varB should not (before varA)
      expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
      const calledQuery = mockExecuteVariableQuery.mock.calls[0][1].query;
      expect(calledQuery).toContain('varA');
      expect(calledQuery).toContain('service'); // varC's query
    });

    it('should partially interpolate when some variables are before and some after', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['result-1', 'result-2']));

      // Variable order: varA, varC (depends on varA and varB), varB
      const varA = makeCustomVariable({ id: 'var-a', name: 'varA', current: ['value-a'] });
      const varC = makeQueryVariable({
        id: 'var-c',
        name: 'varC',
        query: "source=logs | where fieldA = '${varA}' AND fieldB = '${varB}'",
      });
      const varB = makeCustomVariable({ id: 'var-b', name: 'varB', current: ['value-b'] });
      const { service } = createService([varA, varC, varB]);

      // Set up interpolation service
      const interpolationService = new VariableInterpolationService(() =>
        service.getVariablesWithState()
      );
      service.setInterpolationService(interpolationService);

      mockExecuteVariableQuery.mockClear();
      await service.refreshVariableOptions('var-c');

      // varC should be refreshed with varA interpolated but varB kept as placeholder
      expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
      const calledQuery = mockExecuteVariableQuery.mock.calls[0][1].query;
      expect(calledQuery).toContain('value-a'); // varA interpolated
      expect(calledQuery).toContain('${varB}'); // varB kept as placeholder
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
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['api', 'web', 'new-svc']));
      const { service } = createService([makeQueryVariable({ current: ['api'] })]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['api', 'web', 'new-svc']);
      expect(withState[0].current).toEqual(['api']);
      expect(withState[0].loading).toBe(false);
    });

    it('should preserve current value even when not in new options (Query variables)', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['new-a', 'new-b']));
      const { service } = createService([makeQueryVariable({ current: ['old-value'] })]);

      await service.refreshVariableOptions('query-1');
      // For Query variables, preserve user's selection even if not in current options
      expect(service.getVariables()[0].current).toEqual(['old-value']);
    });

    it('should build query options from configured value and label fields', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [
          { service_id: 'svc-1', service_name: 'API service' },
          { service_id: 'svc-2', service_name: 'Web service' },
        ],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService([
        makeQueryVariable({
          current: ['svc-1'],
          valueField: 'service_id',
          labelField: 'service_name',
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: 'svc-1', label: 'API service' },
        { value: 'svc-2', label: 'Web service' },
      ]);
      expect(withState[0].current).toEqual(['svc-1']);
    });

    it('should return empty query options when configured value field is missing', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['api']));
      const { service } = createService([
        makeQueryVariable({ current: undefined, valueField: 'missing' }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([]);
      expect(withState[0].current).toBeUndefined();
    });

    it('should flatten array value fields and omit labels', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [{ service_id: ['svc-1', 'svc-2'], service_name: 'Shared label' }],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService([
        makeQueryVariable({
          valueField: 'service_id',
          labelField: 'service_name',
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([{ value: 'svc-1' }, { value: 'svc-2' }]);
    });

    it('should filter query options by value instead of label', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [
          { service_id: 'prod-api', service_name: 'Staging label' },
          { service_id: 'staging-api', service_name: 'Prod label' },
        ],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService([
        makeQueryVariable({
          valueField: 'service_id',
          labelField: 'service_name',
          regex: '^prod',
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([{ value: 'prod-api', label: 'Staging label' }]);
    });

    it('should extract query option values and labels with regex capture groups', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [{ service: 'env=prod,label=Production' }, { service: 'env=dev,label=Development' }],
        fields: ['service'],
        fieldTypes: { service: 'string' },
      });
      const { service } = createService([
        makeQueryVariable({
          current: undefined,
          regex: '^env=(?<value>[^,]+),label=(?<label>.+)$',
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: 'prod', label: 'Production' },
        { value: 'dev', label: 'Development' },
      ]);
      expect(service.getVariables()[0].current).toEqual(['prod']);
    });

    it('should set error state on fetch failure', async () => {
      mockExecuteVariableQuery.mockRejectedValue(new Error('Network error'));
      const { service } = createService([makeQueryVariable()]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].loading).toBe(false);
      expect(withState[0].error).toBe('Network error');
    });

    it('should silently ignore AbortError', async () => {
      mockExecuteVariableQuery.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      const { service } = createService([makeQueryVariable()]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].error).toBeUndefined();
    });

    it('should abort previous request when called again for same variable', async () => {
      let callCount = 0;
      mockExecuteVariableQuery.mockImplementation(
        (_dp: any, _params: any, signal?: AbortSignal) => {
          callCount++;
          return new Promise((resolve, reject) => {
            const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
            if (signal?.aborted) return onAbort();
            signal?.addEventListener('abort', onAbort);
            setTimeout(() => resolve(makeQueryResult([`result-${callCount}`])), 50);
          });
        }
      );

      const { service } = createService([makeQueryVariable()]);

      const first = service.refreshVariableOptions('query-1');
      const second = service.refreshVariableOptions('query-1');
      await Promise.all([first, second]);

      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['result-2']);
    });

    it('should skip non-query variables', async () => {
      const { service } = createService([makeCustomVariable()]);
      await service.refreshVariableOptions('custom-1');
      expect(mockExecuteVariableQuery).not.toHaveBeenCalled();
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
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['svc-a', 'svc-b']));
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

      expect(mockExecuteVariableQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          query: "source=logs | where region = 'us-east' | dedup service | fields service",
        }),
        expect.anything(),
        false
      );
    });
  });

  describe('refreshAllVariableOptions — sequential execution', () => {
    it('should refresh variables sequentially', async () => {
      const callOrder: string[] = [];
      mockExecuteVariableQuery.mockImplementation((_dp: any, params: any) => {
        callOrder.push(params.query);
        return Promise.resolve(makeQueryResult(['result']));
      });

      const v1 = makeQueryVariable({ id: 'q1', name: 'first', query: 'query-1' });
      const v2 = makeQueryVariable({ id: 'q2', name: 'second', query: 'query-2' });
      const { service } = createService([v1, v2]);

      await service.refreshAllVariableOptions();
      expect(callOrder).toEqual(['query-1', 'query-2']);
    });
  });

  describe('refreshTimeFilteredVariableOptions', () => {
    it('should only refresh variables with useTimeFilter enabled', async () => {
      const refreshedQueries: string[] = [];
      mockExecuteVariableQuery.mockImplementation((_dp: any, params: any) => {
        refreshedQueries.push(params.query);
        return Promise.resolve(makeQueryResult(['result']));
      });

      const v1 = makeQueryVariable({
        id: 'q1',
        name: 'timeFiltered',
        query: 'time-filtered-query',
        useTimeFilter: true,
      });
      const v2 = makeQueryVariable({
        id: 'q2',
        name: 'noTimeFilter',
        query: 'no-time-filter-query',
        useTimeFilter: false,
      });
      const v3 = makeQueryVariable({
        id: 'q3',
        name: 'defaultNoTimeFilter',
        query: 'default-query',
      });

      const { service } = createService([v1, v2, v3]);

      await service.refreshTimeFilteredVariableOptions();

      // Only v1 should be refreshed
      expect(refreshedQueries).toEqual(['time-filtered-query']);
    });

    it('should refresh no variables if none have useTimeFilter enabled', async () => {
      const refreshedQueries: string[] = [];
      mockExecuteVariableQuery.mockImplementation((_dp: any, params: any) => {
        refreshedQueries.push(params.query);
        return Promise.resolve(makeQueryResult(['result']));
      });

      const v1 = makeQueryVariable({ id: 'q1', name: 'first', query: 'query-1' });
      const v2 = makeQueryVariable({
        id: 'q2',
        name: 'second',
        query: 'query-2',
        useTimeFilter: false,
      });

      const { service } = createService([v1, v2]);

      await service.refreshTimeFilteredVariableOptions();

      expect(refreshedQueries).toEqual([]);
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
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should sort custom variable options alphabetically ascending by label', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: [
            { value: '10', label: 'Ten' },
            { value: '2', label: 'Two' },
            { value: '1', label: 'One' },
          ],
          sort: VariableSortOrder.AlphabeticalAsc,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: '1', label: 'One' },
        { value: '10', label: 'Ten' },
        { value: '2', label: 'Two' },
      ]);
    });

    it('should sort custom variable options alphabetically descending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['cherry', 'apple', 'banana'],
          sort: VariableSortOrder.AlphabeticalDesc,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['cherry', 'banana', 'apple']);
    });

    it('should sort numerically ascending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['10', '2', '100', '1'],
          sort: VariableSortOrder.NumericalAsc,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['1', '2', '10', '100']);
    });

    it('should sort custom variable options numerically by value', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: [
            { value: '10', label: 'Ten' },
            { value: '2', label: 'Two' },
            { value: '100', label: 'One hundred' },
            { value: '1', label: 'One' },
          ],
          sort: VariableSortOrder.NumericalAsc,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['1', '2', '10', '100']);
    });

    it('should sort numerically descending', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['10', '2', '100', '1'],
          sort: VariableSortOrder.NumericalDesc,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['100', '10', '2', '1']);
    });

    it('should not sort when sort is disabled', () => {
      const { service } = createService([
        makeCustomVariable({
          customOptions: ['cherry', 'apple', 'banana'],
          sort: VariableSortOrder.Disabled,
        }),
      ]);
      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['cherry', 'apple', 'banana']);
    });

    it('should sort query variable options after refresh', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['zebra', 'apple', 'mango']));
      const { service } = createService([
        makeQueryVariable({ sort: VariableSortOrder.AlphabeticalAsc }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: 'apple' },
        { value: 'mango' },
        { value: 'zebra' },
      ]);
    });

    it('should sort query variable options alphabetically by label', async () => {
      mockExecuteVariableQuery.mockResolvedValue({
        rows: [
          { service_id: 'zebra', service_name: 'A label' },
          { service_id: 'apple', service_name: 'Z label' },
        ],
        fields: ['service_id', 'service_name'],
        fieldTypes: { service_id: 'string', service_name: 'string' },
      });
      const { service } = createService([
        makeQueryVariable({
          valueField: 'service_id',
          labelField: 'service_name',
          sort: VariableSortOrder.AlphabeticalAsc,
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const withState = service.getVariablesWithState();
      expect(withState[0].options).toEqual([
        { value: 'zebra', label: 'A label' },
        { value: 'apple', label: 'Z label' },
      ]);
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
      service.getVariablesWithState();

      await service.updateVariable('custom-1', { sort: VariableSortOrder.AlphabeticalAsc });

      const withState = service.getVariablesWithState();
      expect(getOptionValues(withState[0].options)).toEqual(['apple', 'banana', 'cherry']);
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

      const originalState = service.getVariablesWithState()[0];

      await expect(
        service.updateVariable('custom-1', { customOptions: ['alpha', 'beta'] } as any)
      ).rejects.toThrow('Network error');

      // Runtime state should not change
      const currentState = service.getVariablesWithState()[0];
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
      expect(getOptionValues(emissions[emissions.length - 1][0].options)).toEqual(['a', 'b']);
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
      expect(getOptionValues(emissions[emissions.length - 1][0].options)).toEqual([
        'alpha',
        'beta',
      ]);
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

  describe('getVariablesWithState (synchronous)', () => {
    it('should return variables with runtime state', () => {
      const { service } = createService([makeCustomVariable()]);
      const vars = service.getVariablesWithState();

      expect(vars).toHaveLength(1);
      expect(vars[0]).toMatchObject({
        id: 'custom-1',
        name: 'env',
        type: VariableType.Custom,
        options: [{ value: 'dev' }, { value: 'staging' }, { value: 'prod' }],
      });
    });

    it('should include optionType in runtime state for query variables', async () => {
      mockExecuteVariableQuery.mockResolvedValue(
        makeQueryResult([6283, 120, 223], 'product_id', 'number')
      );

      const { service } = createService([
        makeQueryVariable({
          name: 'productId',
          query: 'source=logs | dedup product_id | fields product_id',
          current: undefined,
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const vars = service.getVariablesWithState();
      expect(vars).toHaveLength(1);
      expect(vars[0].optionType).toBe('number');
      expect(vars[0].options).toEqual([{ value: '6283' }, { value: '120' }, { value: '223' }]);
    });

    it('should return empty options for custom variables initially', () => {
      const { service } = createService([
        makeCustomVariable({ customOptions: ['dev', 'prod'], current: ['dev'] }),
      ]);

      const vars = service.getVariablesWithState();
      expect(vars[0].options).toEqual([{ value: 'dev' }, { value: 'prod' }]);
      expect(vars[0].optionType).toBeUndefined();
    });
  });

  describe('option limit', () => {
    it('should limit query variable options to 100', async () => {
      const options = Array.from({ length: 150 }, (_, i) => `option-${i}`);
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(options));

      const { service } = createService([
        makeQueryVariable({
          name: 'large',
          query: 'source=logs | dedup field | fields field',
          current: undefined,
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const vars = service.getVariablesWithState();
      expect(vars[0].options.length).toBe(100);
      expect(vars[0].options[0].value).toBe('option-0');
      expect(vars[0].options[99].value).toBe('option-99');
    });

    it('should limit custom variable options to 100', () => {
      const customOptions = Array.from({ length: 150 }, (_, i) => `option-${i}`);
      const { service } = createService([
        makeCustomVariable({ name: 'large', customOptions, current: ['option-0'] }),
      ]);

      const vars = service.getVariablesWithState();
      expect(vars[0].options.length).toBe(100);
      expect(vars[0].options[0].value).toBe('option-0');
      expect(vars[0].options[99].value).toBe('option-99');
    });

    it('should not truncate options when count is less than 100', async () => {
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(['a', 'b', 'c']));

      const { service } = createService([
        makeQueryVariable({
          name: 'small',
          query: 'source=logs | dedup field | fields field',
          current: undefined,
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const vars = service.getVariablesWithState();
      expect(vars[0].options).toEqual([{ value: 'a' }, { value: 'b' }, { value: 'c' }]);
    });

    it('should limit to 100 before sorting for query variables', async () => {
      // Create 150 options in reverse alphabetical order
      const options = Array.from(
        { length: 150 },
        (_, i) => `option-${String(149 - i).padStart(3, '0')}`
      );
      mockExecuteVariableQuery.mockResolvedValue(makeQueryResult(options));

      const { service } = createService([
        makeQueryVariable({
          name: 'sorted',
          query: 'source=logs | dedup field | fields field',
          sort: VariableSortOrder.AlphabeticalAsc,
          current: undefined,
        }),
      ]);

      await service.refreshVariableOptions('query-1');

      const vars = service.getVariablesWithState();
      // Should have first 100 options (unsorted: option-149 to option-050) then sorted
      expect(vars[0].options.length).toBe(100);
      // After limiting to first 100 (option-149 to option-050) and sorting, first should be option-050
      expect(vars[0].options[0].value).toBe('option-050');
      expect(vars[0].options[99].value).toBe('option-149');
    });

    it('should limit to 100 before sorting for custom variables', () => {
      // Create 150 options in reverse alphabetical order
      const customOptions = Array.from(
        { length: 150 },
        (_, i) => `option-${String(149 - i).padStart(3, '0')}`
      );
      const { service } = createService([
        makeCustomVariable({
          name: 'sorted',
          customOptions,
          sort: VariableSortOrder.AlphabeticalAsc,
          current: ['option-100'],
        }),
      ]);

      const vars = service.getVariablesWithState();
      // Should have first 100 options (unsorted: option-149 to option-050) then sorted
      expect(vars[0].options.length).toBe(100);
      expect(vars[0].options[0].value).toBe('option-050');
      expect(vars[0].options[99].value).toBe('option-149');
    });
  });
});
