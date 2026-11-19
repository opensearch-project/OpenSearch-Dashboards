/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractPPLSourceIndex,
  getPPLSourceTimeFieldChecker,
  pplSourceDiffersFromDataset,
  PPLSourceTimeFieldChecker,
} from './ppl_source_utils';

describe('extractPPLSourceIndex', () => {
  it('extracts a plain source index', () => {
    expect(extractPPLSourceIndex('source=my_index | head 10')).toBe('my_index');
  });

  it('tolerates whitespace around =', () => {
    expect(extractPPLSourceIndex('source = my_index')).toBe('my_index');
  });

  it('strips backticks and quotes', () => {
    expect(extractPPLSourceIndex('source=`my_index`')).toBe('my_index');
    expect(extractPPLSourceIndex("source='my_index'")).toBe('my_index');
    expect(extractPPLSourceIndex('source="my_index"')).toBe('my_index');
  });

  it('is case-insensitive on the keyword', () => {
    expect(extractPPLSourceIndex('SOURCE=my_index')).toBe('my_index');
  });

  it('keeps a cross-cluster prefix', () => {
    expect(extractPPLSourceIndex('source=remote:logs | head 1')).toBe('remote:logs');
  });

  it('returns undefined when there is no source=', () => {
    expect(extractPPLSourceIndex('search field=1')).toBeUndefined();
    expect(extractPPLSourceIndex('')).toBeUndefined();
  });

  it('reads only the first source=', () => {
    expect(extractPPLSourceIndex('source=first | join source=second')).toBe('first');
  });
});

describe('pplSourceDiffersFromDataset', () => {
  it('is false for an exact match', () => {
    expect(pplSourceDiffersFromDataset('source=request_logs', 'request_logs')).toBe(false);
  });

  it('is false when the source is covered by a wildcard title', () => {
    expect(pplSourceDiffersFromDataset('source=request_logs', 'request_logs*')).toBe(false);
    expect(pplSourceDiffersFromDataset('source=logs-2026.10', 'logs-*')).toBe(false);
    expect(pplSourceDiffersFromDataset('source=logs-a-prod', 'logs-*-prod')).toBe(false);
  });

  it('is false when the source is the wildcard title itself', () => {
    expect(pplSourceDiffersFromDataset('source = logs-* | stats count()', 'logs-*')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(pplSourceDiffersFromDataset('source=Request_Logs', 'request_logs')).toBe(false);
  });

  it('is true for a clearly different index', () => {
    expect(pplSourceDiffersFromDataset('source=endpoints', 'request_logs*')).toBe(true);
  });

  it('treats a comma-separated title as a list of patterns', () => {
    expect(pplSourceDiffersFromDataset('source=b', 'a, b*')).toBe(false);
    expect(pplSourceDiffersFromDataset('source=c', 'a,b*')).toBe(true);
  });

  it('escapes regex metacharacters in the title', () => {
    expect(pplSourceDiffersFromDataset('source=logsXprod', 'logs.prod')).toBe(true);
  });

  it('is false when either side is missing', () => {
    expect(pplSourceDiffersFromDataset('search field=1', 'request_logs')).toBe(false);
    expect(pplSourceDiffersFromDataset('source=endpoints', undefined)).toBe(false);
  });
});

describe('PPLSourceTimeFieldChecker', () => {
  const dataset = {
    title: 'logs-a',
    timeFieldName: '@timestamp',
    dataSource: { id: 'ds-1' },
  };
  const fieldsByPattern: Record<string, Array<{ name: string }>> = {
    'logs-b': [{ name: '@timestamp' }, { name: 'host' }],
    lookup: [{ name: 'key' }, { name: 'value' }],
  };

  let resolveFields: jest.Mock;
  let checker: PPLSourceTimeFieldChecker;

  beforeEach(() => {
    resolveFields = jest.fn(async (pattern: string) => {
      const fields = fieldsByPattern[pattern];
      if (!fields) throw new Error(`no such index: ${pattern}`);
      return fields;
    });
    checker = new PPLSourceTimeFieldChecker(resolveFields);
  });

  it('does not check (and never skips) when the source matches the dataset', async () => {
    await expect(
      checker.sourceLacksTimeField('source=logs-a | fields host', dataset)
    ).resolves.toBe(false);
    expect(checker.peek('source=logs-a | fields host', dataset)).toBe(false);
    expect(resolveFields).not.toHaveBeenCalled();
  });

  it('does not check when the dataset has no time field', async () => {
    await expect(
      checker.sourceLacksTimeField('source=lookup', { ...dataset, timeFieldName: undefined })
    ).resolves.toBe(false);
    expect(resolveFields).not.toHaveBeenCalled();
  });

  it('reports false for a different source that has the time field', async () => {
    await expect(checker.sourceLacksTimeField('source=logs-b', dataset)).resolves.toBe(false);
    expect(resolveFields).toHaveBeenCalledWith('logs-b', 'ds-1');
  });

  it('reports true for a different source that lacks the time field', async () => {
    await expect(checker.sourceLacksTimeField('source=lookup | head 5', dataset)).resolves.toBe(
      true
    );
  });

  it('is unknown before the first check and cached after it', async () => {
    expect(checker.peek('source=lookup', dataset)).toBeUndefined();
    await checker.sourceLacksTimeField('source=lookup', dataset);
    expect(checker.peek('source=lookup | stats count()', dataset)).toBe(true);
    await checker.sourceLacksTimeField('source=lookup | head 1', dataset);
    expect(resolveFields).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent checks of the same source', async () => {
    await Promise.all([
      checker.sourceLacksTimeField('source=lookup', dataset),
      checker.sourceLacksTimeField('source=lookup | head 1', dataset),
    ]);
    expect(resolveFields).toHaveBeenCalledTimes(1);
  });

  it('keys the cache by data source and time field', async () => {
    await checker.sourceLacksTimeField('source=lookup', dataset);
    await checker.sourceLacksTimeField('source=lookup', {
      ...dataset,
      dataSource: { id: 'ds-2' },
    });
    await checker.sourceLacksTimeField('source=lookup', { ...dataset, timeFieldName: 'ts' });
    expect(resolveFields).toHaveBeenCalledTimes(3);
  });

  it('reports false (apply the filter) when the field lookup fails, and retries later', async () => {
    await expect(checker.sourceLacksTimeField('source=missing', dataset)).resolves.toBe(false);
    // A failure is not an answer: it is not cached, so peek stays unknown and the next query retries.
    expect(checker.peek('source=missing', dataset)).toBeUndefined();
    await checker.sourceLacksTimeField('source=missing', dataset);
    expect(resolveFields).toHaveBeenCalledTimes(2);
  });

  it('reports false when the resolver returns something other than a field list', async () => {
    resolveFields.mockResolvedValueOnce(undefined);
    await expect(checker.sourceLacksTimeField('source=lookup', dataset)).resolves.toBe(false);
    expect(checker.peek('source=lookup', dataset)).toBeUndefined();
  });
});

describe('getPPLSourceTimeFieldChecker', () => {
  it('returns one checker per index patterns service', () => {
    const indexPatterns = { getFieldsForWildcard: jest.fn() };
    expect(getPPLSourceTimeFieldChecker(indexPatterns)).toBe(
      getPPLSourceTimeFieldChecker(indexPatterns)
    );
    expect(getPPLSourceTimeFieldChecker(indexPatterns)).not.toBe(
      getPPLSourceTimeFieldChecker({ getFieldsForWildcard: jest.fn() })
    );
  });

  it('asks getFieldsForWildcard for the source pattern on the dataset data source', async () => {
    const indexPatterns = {
      getFieldsForWildcard: jest.fn().mockResolvedValue([{ name: 'key' }]),
    };
    const lacks = await getPPLSourceTimeFieldChecker(indexPatterns).sourceLacksTimeField(
      'source=lookup',
      { title: 'logs', timeFieldName: '@timestamp', dataSource: { id: 'ds-9' } }
    );
    expect(lacks).toBe(true);
    expect(indexPatterns.getFieldsForWildcard).toHaveBeenCalledWith({
      pattern: 'lookup',
      dataSourceId: 'ds-9',
    });
  });
});
