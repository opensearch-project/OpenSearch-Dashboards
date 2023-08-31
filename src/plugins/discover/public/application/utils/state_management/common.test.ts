/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addColumn, removeColumn, reorderColumn } from './common';

describe('commonUtils', () => {
  it('should handle addColumn', () => {
    expect(addColumn(['column1'], { column: 'column2' })).toEqual(['column1', 'column2']);
    expect(addColumn(['column1'], { column: 'column2', index: 0 })).toEqual(['column2', 'column1']);
  });

  it('should handle removeColumn', () => {
    expect(removeColumn(['column1', 'column2'], 'column1')).toEqual(['column2']);
  });

  it('should handle reorderColumn', () => {
    expect(reorderColumn(['column1', 'column2', 'column3'], 0, 2)).toEqual([
      'column2',
      'column3',
      'column1',
    ]);
  });
});
