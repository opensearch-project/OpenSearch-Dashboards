/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildSlicesMarkForVega, buildPieMarks, buildArcMarks } from './mark_slices';

describe('buildSlicesMarkForVega', () => {
  it('should return a group mark with correct properties', () => {
    const result = buildSlicesMarkForVega(['level1', 'level2'], true, true);
    expect(result.type).toBe('group');
    expect(result.from).toEqual({ data: 'splits' });
    expect(result.encode.enter.width).toEqual({ signal: 'chartWidth' });
    expect(result.title).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.marks).toBeDefined();
  });

  it('should handle non-split case correctly', () => {
    const result = buildSlicesMarkForVega(['level1'], false, true);
    expect(result.from).toBeNull();
    expect(result.encode.enter.width).toEqual({ signal: 'width' });
    expect(result.title).toBeNull();
  });
});

describe('buildPieMarks', () => {
  it('should create correct number of marks', () => {
    const result = buildPieMarks(['level1', 'level2'], true);
    expect(result).toHaveLength(2);
  });

  it('should create correct transformations', () => {
    const result = buildPieMarks(['level1'], true);
    expect(result[0].transform).toHaveLength(3);
    expect(result[0].transform[0].type).toBe('filter');
    expect(result[0].transform[1].type).toBe('aggregate');
    expect(result[0].transform[2].type).toBe('pie');
  });
});

describe('buildArcMarks', () => {
  it('should create correct number of arc marks', () => {
    const result = buildArcMarks(['level1', 'level2'], false);
    expect(result).toHaveLength(2);
    expect(result[0].encode.update.tooltip).toBeUndefined();
  });

  it('should create arc marks with correct properties', () => {
    const result = buildArcMarks(['level1'], true);
    expect(result[0].type).toBe('arc');
    expect(result[0].encode.enter.fill).toBeDefined();
    expect(result[0].encode.update.startAngle).toBeDefined();
    expect(result[0].encode.update.tooltip).toBeDefined();
  });
});
