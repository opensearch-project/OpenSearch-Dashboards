/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSourceColumn } from './is_source_column';

describe('isSourceColumn', () => {
  it("follows the dataset's field when it lists one", () => {
    expect(isSourceColumn('_source', { type: '_source' })).toBe(true);
    expect(isSourceColumn('message', { type: 'string' })).toBe(false);
  });

  it('treats the _source column as the row view when the dataset has no such field', () => {
    expect(isSourceColumn('_source', undefined)).toBe(true);
  });

  it('leaves other unlisted columns alone', () => {
    expect(isSourceColumn('service', undefined)).toBe(false);
  });
});
