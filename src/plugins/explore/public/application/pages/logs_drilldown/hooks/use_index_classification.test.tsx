/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { useIndexClassification } from './use_index_classification';
import { ClassificationResult, IndexClassification } from '../types';

const getFieldsForWildcard = jest.fn();
const makeServices = () => ({ indexPatterns: { getFieldsForWildcard } }) as unknown as any;

// Expose the hook's API to the test via a ref-carrying harness (no react-hooks testing lib here).
interface Api {
  classify: (name: string) => Promise<ClassificationResult>;
  getCached: (name: string) => ClassificationResult | undefined;
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
