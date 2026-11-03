/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { useIndexClassification } from './use_index_classification';
import { ClassificationResult, IndexClassification } from '../types';
import { resetServerlessCaches } from '../serverless';

const getFieldsForWildcard = jest.fn();
const savedObjectsGet = jest.fn();
const httpGet = jest.fn();
const makeServices = () =>
  ({
    indexPatterns: { getFieldsForWildcard },
    savedObjects: { client: { get: savedObjectsGet } },
    http: { get: httpGet },
  }) as unknown as any;
const serverless = () =>
  savedObjectsGet.mockResolvedValue({
    attributes: { dataSourceEngineType: 'OpenSearch Serverless' },
  });

// Expose the hook's API to the test via a ref-carrying harness (no react-hooks testing lib here).
interface Api {
  classify: (name: string, kind?: 'index' | 'dataset') => Promise<ClassificationResult>;
  getCached: (name: string, kind?: 'index' | 'dataset') => ClassificationResult | undefined;
  getStatus: (name: string) => IndexClassification;
}
let api: Api;
// MDS-only: the hook requires a data source id. `dataSourceId` is passed through verbatim — the outer
// suite renders with a concrete id; the no-data-source suite passes none.
const Harness: React.FC<{ dataSourceId?: string }> = ({ dataSourceId }) => {
  api = useIndexClassification(makeServices(), dataSourceId);
  return null;
};

describe('useIndexClassification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetServerlessCaches();
    // Default: a non-serverless engine, so no settings lookup.
    savedObjectsGet.mockResolvedValue({ attributes: { dataSourceEngineType: 'OpenSearch' } });
    render(<Harness dataSourceId="ds-1" />);
  });

  it('classifies a time-based index and picks the first date field as the time field', async () => {
    getFieldsForWildcard.mockResolvedValue([
      { name: '@timestamp', type: 'date' },
      { name: 'message', type: 'text' },
      { name: 'level', type: 'keyword' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('logs-app-1');
    });
    expect(res!.classification).toBe(IndexClassification.TIME_BASED);
    expect(res!.timeFieldName).toBe('@timestamp');
    expect(res!.dateFields).toEqual(['@timestamp']);
    // Severity detected from a keyword field (not a date field).
    expect(res!.severityField).toBe('level');
  });

  it('surfaces ALL date fields for a multi-timestamp index (user can switch the time field)', async () => {
    getFieldsForWildcard.mockResolvedValue([
      { name: '@timestamp', type: 'date' },
      { name: 'observedTimestamp', type: 'date' },
      { name: 'event.ingested', type: 'date' },
      { name: 'severityText', type: 'keyword' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('otel-multi');
    });
    expect(res!.classification).toBe(IndexClassification.TIME_BASED);
    // All date fields are returned so the create-flow time-field picker can offer them.
    expect(res!.dateFields).toEqual(['@timestamp', 'observedTimestamp', 'event.ingested']);
    expect(res!.timeFieldName).toBe('@timestamp');
    expect(res!.severityField).toBe('severityText');
  });

  it('flattens dotted nested date fields into dateFields (they appear in the picker)', async () => {
    // _field_caps returns leaf fields with dotted paths; nested date subfields must be offered.
    getFieldsForWildcard.mockResolvedValue([
      { name: 'attributes.time', type: 'date' },
      { name: 'resource.attributes.observedTimestamp', type: 'date' },
      { name: 'body', type: 'text' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('otel-deeply-nested');
    });
    expect(res!.classification).toBe(IndexClassification.TIME_BASED);
    expect(res!.dateFields).toEqual(['attributes.time', 'resource.attributes.observedTimestamp']);
    // No canonical top-level match → falls back to the first (nested) date field.
    expect(res!.timeFieldName).toBe('attributes.time');
  });

  it('picks the canonical OTel/PPL time field, not just the first date field', async () => {
    // `event.ingested` sorts first but the heuristic should prefer `timestamp` over it.
    getFieldsForWildcard.mockResolvedValue([
      { name: 'event.ingested', type: 'date' },
      { name: 'timestamp', type: 'date' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('otel-ordered');
    });
    expect(res!.timeFieldName).toBe('timestamp');
  });

  it('classifies an index with NO timestamp as NO_TIME_FIELD (no histogram)', async () => {
    getFieldsForWildcard.mockResolvedValue([
      { name: 'user_id', type: 'keyword' },
      { name: 'email', type: 'text' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('lookup-users');
    });
    expect(res!.classification).toBe(IndexClassification.NO_TIME_FIELD);
    expect(res!.dateFields).toEqual([]);
    expect(res!.timeFieldName).toBeUndefined();
    expect(res!.severityField).toBeUndefined();
  });

  it('detects severity even on a no-time-field index (level without a date)', async () => {
    getFieldsForWildcard.mockResolvedValue([
      { name: 'level', type: 'keyword' },
      { name: 'msg', type: 'text' },
    ]);
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('no-time-but-leveled');
    });
    expect(res!.classification).toBe(IndexClassification.NO_TIME_FIELD);
    expect(res!.severityField).toBe('level');
  });

  it('degrades to NO_TIME_FIELD when the field fetch fails', async () => {
    getFieldsForWildcard.mockRejectedValue(new Error('field_caps unavailable'));
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('broken-index');
    });
    expect(res!.classification).toBe(IndexClassification.NO_TIME_FIELD);
  });

  it('prefers the serverless index.timestamp_field over the canonical candidates', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([
      { name: 'time', type: 'date' },
      { name: 'event_time', type: 'date' },
    ]);
    httpGet.mockResolvedValue({
      'custom-ts': { settings: { index: { timestamp_field: 'event_time' } } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('custom-ts');
    });
    expect(httpGet).toHaveBeenCalledWith(
      '/api/directquery/dsl/indices.getFieldSettings/dataSourceMDSId=ds-1',
      { query: { index: 'custom-ts' } }
    );
    expect(res!.timeFieldName).toBe('event_time');
    expect(res!.dateFields).toEqual(['time', 'event_time']);
  });

  it('falls back to the candidate order when matched indexes disagree on timestamp_field', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([
      { name: '@timestamp', type: 'date' },
      { name: 'event_time', type: 'date' },
    ]);
    httpGet.mockResolvedValue({
      'logs-a': { settings: { index: { timestamp_field: '@timestamp' } } },
      'logs-b': { settings: { index: { timestamp_field: 'event_time' } } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('logs-*');
    });
    expect(res!.timeFieldName).toBe('@timestamp');
  });

  it('stays time-based on serverless when the field fetch fails but timestamp_field is known', async () => {
    serverless();
    getFieldsForWildcard.mockRejectedValue(new Error('field_caps timed out'));
    httpGet.mockResolvedValue({
      'logs-a': { settings: { index: { timestamp_field: '@timestamp' } } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('logs-a');
    });
    expect(res!.classification).toBe(IndexClassification.TIME_BASED);
    expect(res!.timeFieldName).toBe('@timestamp');
  });

  it('does not read index settings for non-serverless data sources', async () => {
    savedObjectsGet.mockResolvedValue({ attributes: { dataSourceEngineType: 'OpenSearch' } });
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    await act(async () => {
      await api.classify('logs-a');
    });
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('treats an index without timestamp_field as disagreement for a pattern', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([
      { name: '@timestamp', type: 'date' },
      { name: 'event_time', type: 'date' },
    ]);
    httpGet.mockResolvedValue({
      'logs-a': { settings: { index: { timestamp_field: 'event_time' } } },
      'logs-b': { settings: { index: {} } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('logs-*');
    });
    expect(res!.timeFieldName).toBe('@timestamp');
  });

  it('stays time-based when field caps returns no date field but timestamp_field is known', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([{ name: 'level', type: 'string' }]);
    httpGet.mockResolvedValue({
      'fresh-index': { settings: { index: { timestamp_field: '@timestamp' } } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('fresh-index');
    });
    expect(res!.classification).toBe(IndexClassification.TIME_BASED);
    expect(res!.timeFieldName).toBe('@timestamp');
    expect(res!.severityField).toBe('level');
  });

  it('tries the timestamp_field lookup when no engine type is saved', async () => {
    savedObjectsGet.mockResolvedValue({ attributes: {} });
    getFieldsForWildcard.mockResolvedValue([
      { name: 'time', type: 'date' },
      { name: 'event_time', type: 'date' },
    ]);
    httpGet.mockResolvedValue({
      'custom-ts': { settings: { index: { timestamp_field: 'event_time' } } },
    });
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('custom-ts');
    });
    expect(res!.timeFieldName).toBe('event_time');
  });

  it('retries the engine-type lookup after a transient failure', async () => {
    savedObjectsGet
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({ attributes: { dataSourceEngineType: 'OpenSearch Serverless' } });
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    httpGet.mockResolvedValue({ a: { settings: { index: { timestamp_field: '@timestamp' } } } });
    await act(async () => {
      await api.classify('a');
      await api.classify('b');
    });
    expect(savedObjectsGet).toHaveBeenCalledTimes(2);
  });

  it('skips the settings lookup for dataset rows', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    await act(async () => {
      await api.classify('logs-*', 'dataset');
    });
    expect(httpGet).not.toHaveBeenCalled();
    expect(api.getCached('logs-*', 'dataset')?.classification).toBe(IndexClassification.TIME_BASED);
    expect(api.getCached('logs-*')).toBeUndefined();
  });

  it('stops calling the settings route for a data source once the route is missing', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    httpGet.mockRejectedValue({ body: { statusCode: 404, message: 'Not Found' } });
    await act(async () => {
      await api.classify('a');
      await api.classify('b');
    });
    expect(httpGet).toHaveBeenCalledTimes(1);
  });

  it('keeps calling the settings route after an index_not_found 404', async () => {
    serverless();
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    httpGet.mockRejectedValue({
      body: {
        statusCode: 404,
        message: 'Data Source Error: [index_not_found_exception] no such index',
      },
    });
    await act(async () => {
      await api.classify('a');
      await api.classify('b');
    });
    expect(httpGet).toHaveBeenCalledTimes(2);
  });

  it('URL-encodes the data source id in the settings path', async () => {
    cleanup();
    render(<Harness dataSourceId="ds/odd?id" />);
    serverless();
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    httpGet.mockResolvedValue({});
    await act(async () => {
      await api.classify('a');
    });
    expect(httpGet.mock.calls[0][0]).toBe(
      '/api/directquery/dsl/indices.getFieldSettings/dataSourceMDSId=ds%2Fodd%3Fid'
    );
  });

  it('caches the result: a second classify does not re-fetch', async () => {
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    await act(async () => {
      await api.classify('cached-index');
    });
    await act(async () => {
      await api.classify('cached-index');
    });
    expect(getFieldsForWildcard).toHaveBeenCalledTimes(1);
    expect(api.getCached('cached-index')?.classification).toBe(IndexClassification.TIME_BASED);
  });

  it('getStatus reports UNKNOWN before any classify, then the resolved classification', async () => {
    getFieldsForWildcard.mockResolvedValue([{ name: '@timestamp', type: 'date' }]);
    expect(api.getStatus('x')).toBe(IndexClassification.UNKNOWN);
    await act(async () => {
      await api.classify('x');
    });
    expect(api.getStatus('x')).toBe(IndexClassification.TIME_BASED);
  });
});

// MDS-only: no local cluster, so field resolution must target an explicit data source.
// Separate describe so it does NOT inherit the outer beforeEach that renders with a default id.
describe('useIndexClassification — no data source (MDS-only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup(); // unmount any harness from the prior describe so `api` reflects only this render
    render(<Harness dataSourceId={undefined} />);
  });

  it('does NOT call getFieldsForWildcard when there is no data source id', async () => {
    let res: ClassificationResult;
    await act(async () => {
      res = await api.classify('logs-app-1');
    });
    expect(getFieldsForWildcard).not.toHaveBeenCalled();
    expect(res!.classification).toBe(IndexClassification.NO_TIME_FIELD);
  });
});
