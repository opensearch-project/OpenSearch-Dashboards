/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildColumns } from './columns';

describe('buildColumns', () => {
  it('returns ["_source"] if columns is empty', () => {
    expect(buildColumns([])).toEqual(['_source']);
  });

  it('returns columns if there is only one column', () => {
    expect(buildColumns(['foo'])).toEqual(['foo']);
  });

  it('removes "_source" if there are more than one columns', () => {
    expect(buildColumns(['foo', '_source', 'bar'])).toEqual(['foo', 'bar']);
  });

  it('returns columns if there are more than one columns but no "_source"', () => {
    expect(buildColumns(['foo', 'bar'])).toEqual(['foo', 'bar']);
  });
});
