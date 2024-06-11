/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addColumn, removeColumn, reorderColumn, moveColumn } from './common';

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

  it('should handle moveColumn', () => {
    // test moving a column within the array
    expect(moveColumn(['column1', 'column2', 'column3'], 'column2', 0)).toEqual([
      'column2',
      'column1',
      'column3',
    ]);

    // test moving a column to the same index (should result in no change)
    expect(moveColumn(['column1', 'column2', 'column3'], 'column2', 1)).toEqual([
      'column1',
      'column2',
      'column3',
    ]);

    // test moving a column to the end
    expect(moveColumn(['column1', 'column2', 'column3'], 'column1', 2)).toEqual([
      'column2',
      'column3',
      'column1',
    ]);

    // test trying to move a column to an index out of bounds (should return original array)
    expect(moveColumn(['column1', 'column2', 'column3'], 'column1', 3)).toEqual([
      'column1',
      'column2',
      'column3',
    ]);

    // test trying to move a column that doesn't exist (should return original array)
    expect(moveColumn(['column1', 'column2', 'column3'], 'column4', 1)).toEqual([
      'column1',
      'column2',
      'column3',
    ]);
  });
});
