/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLegacyDisplayedColumns } from './helper';
import { IndexPattern } from '../../../opensearch_dashboards_services';

const mockGetFieldByName = jest.fn();

describe('getLegacyDisplayedColumns', () => {
  let indexPattern: IndexPattern;

  beforeEach(() => {
    indexPattern = ({
      getFieldByName: mockGetFieldByName,
      timeFieldName: 'timestamp',
    } as unknown) as IndexPattern;
    mockGetFieldByName.mockReset();
  });

  it('should return correct column properties without time column', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    const result = getLegacyDisplayedColumns(['column1'], indexPattern, true, false);
    expect(result).toEqual([
      {
        name: 'column1',
        displayName: 'column1',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
    ]);
  });

  it('should prepend time column if not hidden, indexPattern has timeFieldName, and columns do not include timeFieldName', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    const result = getLegacyDisplayedColumns(['column1'], indexPattern, false, false);
    expect(result).toEqual([
      {
        name: 'timestamp',
        displayName: 'Time',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
      {
        name: 'column1',
        displayName: 'column1',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
    ]);
  });

  it('should not prepend time column if hideTimeField is true', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    const result = getLegacyDisplayedColumns(['column1'], indexPattern, true, false);
    expect(result).toEqual([
      {
        name: 'column1',
        displayName: 'column1',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
    ]);
  });

  it('should not prepend time column if timeFieldName is included in columns', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    const result = getLegacyDisplayedColumns(['column1', 'timestamp'], indexPattern, false, false);
    expect(result).toEqual([
      {
        name: 'column1',
        displayName: 'column1',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: 1,
      },
      {
        name: 'timestamp',
        displayName: 'timestamp',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: 0,
        colRightIdx: -1,
      },
    ]);
  });

  it('should shorten dotted string in displayName if isShortDots is true', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    const result = getLegacyDisplayedColumns(['column.with.dots'], indexPattern, false, true);
    expect(result).toEqual([
      {
        name: 'timestamp',
        displayName: 'Time',
        isSortable: true,
        isRemoveable: false,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
      {
        name: 'column.with.dots',
        displayName: 'c.w.dots',
        isSortable: true,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
    ]);
  });
});
