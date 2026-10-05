/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchSelection } from './search_selection';

describe('SearchSelection', () => {
  test('excludes INDEXES datasets while preserving legacy-compatible index patterns', async () => {
    const regularIndexPattern = {
      id: 'regular-index-pattern',
      type: 'index-pattern',
      attributes: { title: 'logs-*' },
      references: [],
    };
    const indexesDataset = {
      id: 'indexes-dataset',
      type: 'index-pattern',
      attributes: { title: 'logs-2026.09.11', type: 'INDEXES' },
      references: [],
    };
    const rollupIndexPattern = {
      id: 'rollup-index-pattern',
      type: 'index-pattern',
      attributes: { title: 'logs-rollup', type: 'rollup' },
      references: [],
    };
    const getCache = jest
      .fn()
      .mockResolvedValueOnce([regularIndexPattern, indexesDataset, rollupIndexPattern])
      .mockResolvedValueOnce([regularIndexPattern, rollupIndexPattern]);

    const component = new SearchSelection({
      data: { indexPatterns: { getCache } },
    } as any);
    component.setState = ((nextState: any) => {
      component.state = { ...component.state, ...nextState };
    }) as any;

    await component.componentDidMount();

    expect([...component.state.indexPatternIds]).toEqual([
      'regular-index-pattern',
      'rollup-index-pattern',
    ]);
    expect(component.state.hasUnsupportedSources).toBe(true);
    expect(getCache).toHaveBeenNthCalledWith(2, {
      excludeEngineTypes: expect.any(Array),
      excludeDatasetTypes: ['INDEXES'],
    });
  });
});
