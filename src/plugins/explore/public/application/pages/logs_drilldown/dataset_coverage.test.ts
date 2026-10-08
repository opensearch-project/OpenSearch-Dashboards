/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { datasetCoversIndex, indexCoveredByAnyDataset } from './dataset_coverage';

describe('datasetCoversIndex', () => {
  it('matches an exact index name', () => {
    expect(datasetCoversIndex('logs-app-2026.07.09', 'logs-app-2026.07.09')).toBe(true);
    expect(datasetCoversIndex('logs-app-2026.07.09', 'logs-app-2026.07.08')).toBe(false);
  });

  it('matches a trailing wildcard family', () => {
    expect(datasetCoversIndex('logs-app-*', 'logs-app-2026.07.09')).toBe(true);
    expect(datasetCoversIndex('logs-app-*', 'logs-db-1')).toBe(false);
  });

  it('matches a mid/leading wildcard', () => {
    expect(datasetCoversIndex('*-access-*', 'nginx-access-2026.07.09')).toBe(true);
    expect(datasetCoversIndex('*users', 'lookup-users')).toBe(true);
  });

  it('handles comma-separated dataset titles', () => {
    expect(datasetCoversIndex('logs-app-*,nginx-*', 'nginx-access-1')).toBe(true);
    expect(datasetCoversIndex('logs-app-*,nginx-*', 'orders-1')).toBe(false);
  });

  it('strips dataSourceId:: and cross-cluster prefixes before comparing', () => {
    expect(datasetCoversIndex('abc123::logs-app-*', 'logs-app-2026.07.09')).toBe(true);
    expect(datasetCoversIndex('logs-app-*', 'prod:logs-app-2026.07.09')).toBe(true);
  });

  it('does not treat regex specials as wildcards', () => {
    // A literal dot is escaped; only * is a wildcard.
    expect(datasetCoversIndex('logs.app', 'logsXapp')).toBe(false);
    expect(datasetCoversIndex('logs.app', 'logs.app')).toBe(true);
  });

  it('returns false for empty inputs', () => {
    expect(datasetCoversIndex('', 'x')).toBe(false);
    expect(datasetCoversIndex('x', '')).toBe(false);
  });
});

describe('indexCoveredByAnyDataset', () => {
  const datasets = [
    { name: 'nginx-*', datasetId: 'ds-nginx' },
    { name: 'logs-app-*', datasetId: 'ds-logs' },
  ];

  it('returns the first covering dataset', () => {
    expect(indexCoveredByAnyDataset('logs-app-2026.07.09', datasets)?.datasetId).toBe('ds-logs');
    expect(indexCoveredByAnyDataset('nginx-access-1', datasets)?.datasetId).toBe('ds-nginx');
  });

  it('returns undefined when nothing covers the index', () => {
    expect(indexCoveredByAnyDataset('orders-2026', datasets)).toBeUndefined();
  });
});
