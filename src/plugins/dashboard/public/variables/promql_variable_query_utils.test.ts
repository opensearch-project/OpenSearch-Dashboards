/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  mapResourceQueryTextFields,
  interpolateResourceQuery,
  collectResourceQueryTextFields,
  hasValidLabelValuesSelector,
  getPromQLResourceClient,
  executePromQLResourceQuery,
  buildPromQLVariableOptions,
  PromQLResourceClientLike,
} from './promql_variable_query_utils';
import { PromQLLabelMatcher, PromQLResourceQuery } from './types';

function makeMatcher(overrides: Partial<PromQLLabelMatcher> = {}): PromQLLabelMatcher {
  return { label: 'job', operator: '=', value: 'prometheus', ...overrides };
}

function makeClient(overrides: Partial<PromQLResourceClientLike> = {}): PromQLResourceClientLike {
  return {
    getLabels: jest.fn().mockResolvedValue([]),
    getLabelValues: jest.fn().mockResolvedValue([]),
    getMetrics: jest.fn().mockResolvedValue([]),
    getMetricMetadata: jest.fn().mockResolvedValue({}),
    getSeries: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeDataPlugin(client: PromQLResourceClientLike | undefined): any {
  return {
    resourceClientFactory: {
      get: jest.fn().mockReturnValue(client),
    },
  };
}

describe('mapResourceQueryTextFields / interpolateResourceQuery / collectResourceQueryTextFields', () => {
  it('transforms metricRegex for labelNames, leaving other kinds untouched by the same code path', () => {
    const queryType: PromQLResourceQuery = { kind: 'labelNames', metricRegex: 'node_.*' };
    const result = mapResourceQueryTextFields(queryType, (v) => v.toUpperCase());
    expect(result).toEqual({ kind: 'labelNames', metricRegex: 'NODE_.*' });
  });

  it('leaves metricRegex undefined when not set (does not coerce to a transformed empty string)', () => {
    const queryType: PromQLResourceQuery = { kind: 'labelNames' };
    const result = mapResourceQueryTextFields(queryType, (v) => `X${v}X`);
    expect(result).toEqual({ kind: 'labelNames', metricRegex: undefined });
  });

  it('transforms metricRegex for metrics the same way as labelNames', () => {
    const queryType: PromQLResourceQuery = { kind: 'metrics', metricRegex: 'up' };
    const result = mapResourceQueryTextFields(queryType, (v) => `${v}!`);
    expect(result).toEqual({ kind: 'metrics', metricRegex: 'up!' });
  });

  it('transforms label, metric, and every matcher label/value for labelValues', () => {
    const queryType: PromQLResourceQuery = {
      kind: 'labelValues',
      label: '$mylabel',
      metric: '$mymetric',
      matchers: [makeMatcher({ label: '$k', value: '$v' })],
    };
    const result = mapResourceQueryTextFields(queryType, (v) => v.replace('$', 'resolved_'));
    expect(result).toEqual({
      kind: 'labelValues',
      label: 'resolved_mylabel',
      metric: 'resolved_mymetric',
      matchers: [{ label: 'resolved_k', operator: '=', value: 'resolved_v' }],
    });
  });

  it('leaves matchers undefined for labelValues when not set', () => {
    const queryType: PromQLResourceQuery = { kind: 'labelValues', label: 'job' };
    const result = mapResourceQueryTextFields(queryType, (v) => v);
    expect((result as any).matchers).toBeUndefined();
  });

  it('transforms the matcher for series', () => {
    const queryType: PromQLResourceQuery = { kind: 'series', matcher: 'up{job="$var"}' };
    const result = mapResourceQueryTextFields(queryType, (v) => v.replace('$var', 'node'));
    expect(result).toEqual({ kind: 'series', matcher: 'up{job="node"}' });
  });

  it('interpolateResourceQuery delegates straight to mapResourceQueryTextFields', () => {
    const queryType: PromQLResourceQuery = { kind: 'labelNames', metricRegex: '$x' };
    const result = interpolateResourceQuery(queryType, (v) => v.replace('$x', 'resolved'));
    expect(result).toEqual({ kind: 'labelNames', metricRegex: 'resolved' });
  });

  it('collectResourceQueryTextFields returns every free-text field value for labelValues, in field order', () => {
    const queryType: PromQLResourceQuery = {
      kind: 'labelValues',
      label: 'lbl',
      metric: 'met',
      matchers: [makeMatcher({ label: 'a', value: '1' }), makeMatcher({ label: 'b', value: '2' })],
    };
    expect(collectResourceQueryTextFields(queryType)).toEqual(['lbl', 'met', 'a', '1', 'b', '2']);
  });

  it('collectResourceQueryTextFields returns an empty array when labelNames/metrics have no metricRegex', () => {
    expect(collectResourceQueryTextFields({ kind: 'labelNames' })).toEqual([]);
    expect(collectResourceQueryTextFields({ kind: 'metrics' })).toEqual([]);
  });
});

describe('hasValidLabelValuesSelector', () => {
  // Regression coverage for the fix that made executePromQLResourceQuery's labelValues
  // branch enforce the same "at least one non-negative-only matcher, or a metric" rule
  // that the Preview UI already enforced — see use_variable_query_preview.ts.

  it('is valid when a metric is set, regardless of matchers', () => {
    expect(hasValidLabelValuesSelector('up', [])).toBe(true);
    expect(hasValidLabelValuesSelector('up', [makeMatcher({ operator: '!=' })])).toBe(true);
  });

  it('is valid when there are no matchers and no metric (fully unscoped label-values query)', () => {
    expect(hasValidLabelValuesSelector(undefined, [])).toBe(true);
  });

  it('is valid when there are no matchers and metric is an empty/whitespace string', () => {
    expect(hasValidLabelValuesSelector('   ', [])).toBe(true);
  });

  it('is valid when at least one matcher uses "=" even if others are negative', () => {
    const matchers = [
      makeMatcher({ operator: '!=' }),
      makeMatcher({ label: 'env', operator: '=' }),
    ];
    expect(hasValidLabelValuesSelector(undefined, matchers)).toBe(true);
  });

  it('is valid when at least one matcher uses "=~" even if others are negative', () => {
    const matchers = [
      makeMatcher({ operator: '!~' }),
      makeMatcher({ label: 'env', operator: '=~' }),
    ];
    expect(hasValidLabelValuesSelector(undefined, matchers)).toBe(true);
  });

  it('is invalid when the only "=~" matcher can match the empty string (e.g. ".*") and there is no metric', () => {
    // Prometheus rejects a selector whose only matcher matches "" with HTTP 400
    // ("vector selector must contain at least one non-empty matcher").
    expect(
      hasValidLabelValuesSelector(undefined, [makeMatcher({ operator: '=~', value: '.*' })])
    ).toBe(false);
    expect(
      hasValidLabelValuesSelector(undefined, [makeMatcher({ operator: '=~', value: 'a*' })])
    ).toBe(false);
  });

  it('is valid when a "=~" matcher regex cannot match the empty string (e.g. ".+")', () => {
    expect(
      hasValidLabelValuesSelector(undefined, [makeMatcher({ operator: '=~', value: '.+' })])
    ).toBe(true);
    expect(
      hasValidLabelValuesSelector(undefined, [makeMatcher({ operator: '=~', value: 'node_.*' })])
    ).toBe(true);
  });

  it('is invalid when every matcher is negative-only ("!=") and there is no metric', () => {
    const matchers = [makeMatcher({ operator: '!=' })];
    expect(hasValidLabelValuesSelector(undefined, matchers)).toBe(false);
  });

  it('is invalid when every matcher is negative-only ("!~") and there is no metric', () => {
    const matchers = [
      makeMatcher({ operator: '!~' }),
      makeMatcher({ label: 'env', operator: '!~' }),
    ];
    expect(hasValidLabelValuesSelector(undefined, matchers)).toBe(false);
  });

  it('ignores half-empty matcher rows (blank label or value) when deciding validity', () => {
    // A matcher with an empty label/value is not yet "active" — should not count
    // toward satisfying the "at least one =/=~ matcher" requirement, nor toward
    // making the selector negative-only.
    const matchers = [
      makeMatcher({ label: '', value: '', operator: '=' }),
      makeMatcher({ operator: '!=' }),
    ];
    expect(hasValidLabelValuesSelector(undefined, matchers)).toBe(false);
  });
});

describe('getPromQLResourceClient', () => {
  it('returns the registered "prometheus" resource client', () => {
    const client = makeClient();
    const dataPlugin = makeDataPlugin(client);
    expect(getPromQLResourceClient(dataPlugin)).toBe(client);
    expect(dataPlugin.resourceClientFactory.get).toHaveBeenCalledWith('prometheus');
  });

  it('returns undefined when no resource client is registered', () => {
    const dataPlugin = makeDataPlugin(undefined);
    expect(getPromQLResourceClient(dataPlugin)).toBeUndefined();
  });

  it('returns undefined when the factory throws (query_enhancements not installed)', () => {
    const dataPlugin: any = {
      resourceClientFactory: {
        get: jest.fn(() => {
          throw new Error('Connection type unsupported: prometheus');
        }),
      },
    };
    expect(getPromQLResourceClient(dataPlugin)).toBeUndefined();
  });
});

describe('executePromQLResourceQuery', () => {
  it('throws when no dataConnectionId is provided', async () => {
    const dataPlugin = makeDataPlugin(makeClient());
    await expect(
      executePromQLResourceQuery(dataPlugin, undefined, { kind: 'labelNames' })
    ).rejects.toThrow(/A dataset must be selected/);
  });

  it('throws when the PromQL resource client is not registered', async () => {
    const dataPlugin = makeDataPlugin(undefined);
    await expect(
      executePromQLResourceQuery(dataPlugin, 'ds-1', { kind: 'labelNames' })
    ).rejects.toThrow(/PromQL resource client is not available/);
  });

  it('labelNames: calls getLabels with a metricRegex-based selector using the "=~" operator', async () => {
    const getLabels = jest.fn().mockResolvedValue(['job', 'instance']);
    const dataPlugin = makeDataPlugin(makeClient({ getLabels }));

    const result = await executePromQLResourceQuery(dataPlugin, 'ds-1', {
      kind: 'labelNames',
      metricRegex: 'node_.*',
    });

    expect(result).toEqual(['job', 'instance']);
    expect(getLabels).toHaveBeenCalledWith('ds-1', undefined, '{__name__=~"node_.*"}', undefined);
  });

  it('labelNames: passes an undefined selector when no metricRegex is set', async () => {
    const getLabels = jest.fn().mockResolvedValue([]);
    const dataPlugin = makeDataPlugin(makeClient({ getLabels }));

    await executePromQLResourceQuery(dataPlugin, 'ds-1', { kind: 'labelNames' });

    expect(getLabels).toHaveBeenCalledWith('ds-1', undefined, undefined, undefined);
  });

  it('labelValues: calls getLabelValues with a match[] selector built from metric + matchers', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['prometheus', 'node']);
    const dataPlugin = makeDataPlugin(makeClient({ getLabelValues }));

    const result = await executePromQLResourceQuery(dataPlugin, 'ds-1', {
      kind: 'labelValues',
      label: 'job',
      metric: 'up',
      matchers: [makeMatcher({ label: 'env', operator: '=', value: 'prod' })],
    });

    expect(result).toEqual(['prometheus', 'node']);
    expect(getLabelValues).toHaveBeenCalledWith(
      'ds-1',
      { 'match[]': '{__name__="up", env="prod"}' },
      'job',
      undefined
    );
  });

  it('labelValues: passes undefined meta when there is no metric and no active matchers', async () => {
    const getLabelValues = jest.fn().mockResolvedValue([]);
    const dataPlugin = makeDataPlugin(makeClient({ getLabelValues }));

    await executePromQLResourceQuery(dataPlugin, 'ds-1', { kind: 'labelValues', label: 'job' });

    expect(getLabelValues).toHaveBeenCalledWith('ds-1', undefined, 'job', undefined);
  });

  it('labelValues: rejects with a clear error for a negative-only selector, without calling the client', async () => {
    // Regression test for the fix that made the runtime/cascade-refresh path enforce
    // the same negative-only-selector guard the Preview UI already enforced.
    const getLabelValues = jest.fn();
    const dataPlugin = makeDataPlugin(makeClient({ getLabelValues }));

    await expect(
      executePromQLResourceQuery(dataPlugin, 'ds-1', {
        kind: 'labelValues',
        label: 'job',
        matchers: [makeMatcher({ operator: '!=' })],
      })
    ).rejects.toThrow(/is not valid in PromQL/);
    expect(getLabelValues).not.toHaveBeenCalled();
  });

  it('labelValues: allows a negative matcher when a metric is also set', async () => {
    const getLabelValues = jest.fn().mockResolvedValue(['node']);
    const dataPlugin = makeDataPlugin(makeClient({ getLabelValues }));

    const result = await executePromQLResourceQuery(dataPlugin, 'ds-1', {
      kind: 'labelValues',
      label: 'job',
      metric: 'node_network_up',
      matchers: [makeMatcher({ operator: '!=' })],
    });

    expect(result).toEqual(['node']);
    expect(getLabelValues).toHaveBeenCalled();
  });

  it('metrics: calls getMetrics with a metricRegex-based selector as the 4th (metric/selector) argument', async () => {
    const getMetrics = jest.fn().mockResolvedValue(['up', 'node_cpu']);
    const dataPlugin = makeDataPlugin(makeClient({ getMetrics }));
    const timeRange = { from: 'now-15m', to: 'now' };

    const result = await executePromQLResourceQuery(
      dataPlugin,
      'ds-1',
      { kind: 'metrics', metricRegex: 'node_.*' },
      timeRange
    );

    expect(result).toEqual(['up', 'node_cpu']);
    expect(getMetrics).toHaveBeenCalledWith('ds-1', undefined, timeRange, '{__name__=~"node_.*"}');
  });

  it('series: calls getSeries with the raw matcher string and formats each result as a series string', async () => {
    const getSeries = jest.fn().mockResolvedValue([
      { __name__: 'up', job: 'node', instance: 'host:9100' },
      { __name__: 'up', job: 'prometheus' },
    ]);
    const dataPlugin = makeDataPlugin(makeClient({ getSeries }));

    const result = await executePromQLResourceQuery(dataPlugin, 'ds-1', {
      kind: 'series',
      matcher: 'up{job=~".+"}',
    });

    expect(getSeries).toHaveBeenCalledWith('ds-1', 'up{job=~".+"}', undefined, undefined);
    expect(result).toEqual(['up{instance="host:9100", job="node"}', 'up{job="prometheus"}']);
  });

  it('series: falls back to the bare metric name when there are no non-__name__ labels', async () => {
    const getSeries = jest.fn().mockResolvedValue([{ __name__: 'up' }]);
    const dataPlugin = makeDataPlugin(makeClient({ getSeries }));

    const result = await executePromQLResourceQuery(dataPlugin, 'ds-1', {
      kind: 'series',
      matcher: 'up',
    });

    expect(result).toEqual(['up']);
  });
});

describe('buildPromQLVariableOptions', () => {
  it('de-duplicates raw values and wraps each as a NormalizedVariableOption', () => {
    const options = buildPromQLVariableOptions(['prometheus', 'node', 'prometheus']);
    expect(options).toEqual([{ value: 'prometheus' }, { value: 'node' }]);
  });

  it('returns an empty array for an empty input', () => {
    expect(buildPromQLVariableOptions([])).toEqual([]);
  });

  it('applies the shared regex filter/extractor after de-duplication', () => {
    // Plain (unnamed) capture groups only filter, matching without renaming the value.
    const filtered = buildPromQLVariableOptions(['node_cpu', 'node_mem', 'up'], '^node_(.*)$');
    expect(filtered).toEqual([{ value: 'node_cpu' }, { value: 'node_mem' }]);

    // A named `(?<value>...)` capture extracts a new value from the match.
    const extracted = buildPromQLVariableOptions(
      ['node_cpu', 'node_mem', 'up'],
      '^node_(?<value>.*)$'
    );
    expect(extracted).toEqual([{ value: 'cpu' }, { value: 'mem' }]);
  });
});
