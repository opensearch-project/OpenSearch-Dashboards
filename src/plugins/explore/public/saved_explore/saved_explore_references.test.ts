/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractReferences, injectReferences } from './saved_explore_references';

// The `queries` attribute: a list of { refId, query } rows.
const queries = JSON.stringify([
  {
    refId: 'A',
    query: { query: 'x', language: 'PPL', dataset: { id: 'ip-1', type: 'INDEX_PATTERN' } },
  },
  {
    refId: 'B',
    query: { query: 'up', language: 'PROMQL', dataset: { id: 'prom', type: 'PROMETHEUS' } },
  },
]);
const searchSourceRef = {
  name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
  type: 'index-pattern',
  id: 'ip-1',
};

describe('saved explore references', () => {
  it("moves each row's index pattern into the references, keeping the search source's", () => {
    const { attributes, references } = extractReferences({
      attributes: { queries },
      references: [searchSourceRef],
    });

    expect(references).toEqual([
      searchSourceRef,
      { name: 'queries_A_dataset', type: 'index-pattern', id: 'ip-1' },
    ]);
    const [{ query: a }, { query: b }] = JSON.parse(attributes.queries as string);
    expect(a.dataset).toEqual({
      id: 'ip-1',
      type: 'INDEX_PATTERN',
      datasetRefName: 'queries_A_dataset',
    });
    // Not a saved object: no reference.
    expect(b.dataset).toEqual({ id: 'prom', type: 'PROMETHEUS' });
  });

  it('restores the remapped id after an import', () => {
    const { attributes } = extractReferences({ attributes: { queries }, references: [] });
    const savedObject = { queries: attributes.queries as string };

    injectReferences(savedObject, [
      { name: 'queries_A_dataset', type: 'index-pattern', id: 'ip-2' },
    ]);

    const [{ query: a }] = JSON.parse(savedObject.queries);
    expect(a.dataset).toEqual({ id: 'ip-2', type: 'INDEX_PATTERN' });
  });

  it('keeps the saved id when the reference is missing', () => {
    const { attributes } = extractReferences({ attributes: { queries }, references: [] });
    const savedObject = { queries: attributes.queries as string };

    injectReferences(savedObject, []);

    const [{ query: a }] = JSON.parse(savedObject.queries);
    expect(a.dataset.id).toBe('ip-1');
  });

  it("keeps a row's other fields (isHidden) through extract and inject", () => {
    const hiddenQueries = JSON.stringify(
      JSON.parse(queries).map((row: object) => ({ ...row, isHidden: true }))
    );
    const { attributes } = extractReferences({
      attributes: { queries: hiddenQueries },
      references: [],
    });
    expect(
      JSON.parse(attributes.queries as string).map((row: { isHidden?: boolean }) => row.isHidden)
    ).toEqual([true, true]);

    const savedObject = { queries: attributes.queries as string };
    injectReferences(savedObject, [
      { name: 'queries_A_dataset', type: 'index-pattern', id: 'ip-2' },
    ]);
    expect(
      JSON.parse(savedObject.queries).map((row: { isHidden?: boolean }) => row.isHidden)
    ).toEqual([true, true]);
  });

  it('leaves a saved object without rows alone', () => {
    const input = { attributes: { queries: '' }, references: [searchSourceRef] };
    expect(extractReferences(input)).toEqual(input);
  });
});
