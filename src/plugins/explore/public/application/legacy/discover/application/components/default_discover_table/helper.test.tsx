/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLegacyDisplayedColumns } from './helper';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getOsdFieldOverrides } from '../../../../../../../../data/common/osd_field_types/osd_field_types';

const mockGetFieldByName = jest.fn();
jest.mock('../../../../../../../../data/common/osd_field_types/osd_field_types');
const mockedGetOsdFieldOverrides = jest.mocked(getOsdFieldOverrides);

describe('getLegacyDisplayedColumns', () => {
  let indexPattern: IndexPattern;

  beforeEach(() => {
    indexPattern = ({
      getFieldByName: mockGetFieldByName,
      timeFieldName: 'timestamp',
    } as unknown) as IndexPattern;
    mockGetFieldByName.mockReset();
    mockedGetOsdFieldOverrides.mockReset();
  });

  it('should return correct column properties without time column', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    mockedGetOsdFieldOverrides.mockReturnValue({});
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
    mockedGetOsdFieldOverrides.mockReturnValue({});
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
    mockedGetOsdFieldOverrides.mockReturnValue({});
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
    mockedGetOsdFieldOverrides.mockReturnValue({});
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
    mockedGetOsdFieldOverrides.mockReturnValue({});
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

  it('should override column Sortable with OsdFieldOverrides value', () => {
    mockGetFieldByName.mockReturnValue({ sortable: true });
    mockedGetOsdFieldOverrides.mockReturnValue({ sortable: false });
    const result = getLegacyDisplayedColumns(['column1'], indexPattern, true, false);
    expect(result).toEqual([
      {
        name: 'column1',
        displayName: 'column1',
        isSortable: false,
        isRemoveable: true,
        colLeftIdx: -1,
        colRightIdx: -1,
      },
    ]);
  });
});
