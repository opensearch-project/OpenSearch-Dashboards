/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { unparse } from 'papaparse';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { act, renderHook } from '@testing-library/react-hooks';
import { useDiscoverContext } from '../../view_components/context';
import { useSelector } from '../../utils/state_management';
import { AbortError, IndexPattern } from '../../../../../data/common';
import { setServices } from '../../../opensearch_dashboards_services';
import { discoverPluginMock } from '../../../mocks';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import {
  formatRowsForCsv,
  saveDataAsCsv,
  useDiscoverDownloadCsv,
  UseDiscoverDownloadCsvProps,
} from './use_download_csv';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('papaparse', () => ({
  unparse: jest.fn(),
}));

jest.mock('../../view_components/context', () => ({
  useDiscoverContext: jest.fn(),
}));

jest.mock('../../utils/state_management', () => ({
  useSelector: jest.fn(),
}));

const mockRow1: OpenSearchSearchHit<Record<string, number | string>> = {
  fields: {
    event_time: ['2022-12-31T08:14:42.801Z'],
    timestamp: ['2022-12-31T22:14:42.801Z'],
  },
  sort: [],
  _source: {
    bytes_transferred: 9268,
    category: 'Application',
    timestamp: '2022-12-31T22:14:42.801Z',
  },
  _id: '1',
  _index: 'idx1',
  _type: '',
  _score: 1,
};
const mockRow2: OpenSearchSearchHit<Record<string, number | string>> = {
  fields: {
    event_time: ['2022-12-31T06:14:42.801Z'],
    timestamp: ['2022-12-31T22:14:42.801Z'],
  },
  sort: [],
  _source: {
    bytes_transferred: 9268,
    category: 'Application',
    timestamp: '2022-12-31T22:14:42.801Z',
  },
  _id: '2',
  _index: 'idx1',
  _score: 1,
  _type: '',
};
const mockRows = [mockRow1, mockRow2];
const mockHits = 1234;
const mockOnLoading = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();

// this is a mock of index pattern that has just the things needed for this test
const mockIndexPattern = ({
  formatHit: (row: OpenSearchSearchHit) => row._source,
  fields: {
    getByName: (columnName: string) => {
      if (columnName === '_source') {
        return {
          type: '_source',
        };
      }
      return {
        type: 'non-source',
      };
    },
  },
  formatField: (row: OpenSearchSearchHit<Record<string, number | string>>, columnName: string) => {
    return row._source[columnName];
  },
} as unknown) as IndexPattern;

const mockProps: UseDiscoverDownloadCsvProps = {
  rows: [mockRow1],
  hits: mockHits,
  indexPattern: mockIndexPattern,
  onLoading: mockOnLoading,
  onSuccess: mockOnSuccess,
  onError: mockOnError,
};

describe('useDiscoverDownloadCsv', () => {
  beforeAll(() => {
    setServices(discoverPluginMock.createDiscoverServicesMock());
  });

  describe('forematRowsForCsv', () => {
    it('correctly formats rows for CSV for one with _source', () => {
      const result = formatRowsForCsv({
        displayedColumnNames: ['timestamp', '_source'],
        indexPattern: mockIndexPattern,
      })(mockRow1);
      expect(result).toEqual([mockRow1._source.timestamp, JSON.stringify(mockRow1._source)]);
    });

    it('correctly formats rows for CSV for one with custom columns', () => {
      const result = formatRowsForCsv({
        displayedColumnNames: ['bytes_transferred', 'category'],
        indexPattern: mockIndexPattern,
      })(mockRow1);
      expect(result).toEqual([mockRow1._source.bytes_transferred, mockRow1._source.category]);
    });

    it('correctly returns empty string for when row is undefined', () => {
      const result = formatRowsForCsv({
        displayedColumnNames: ['bytes_transferred', 'category'],
        indexPattern: mockIndexPattern,
      })(undefined as any);
      expect(result).toEqual(['', '']);
    });

    it('correctly returns empty string for when column doesnt exist', () => {
      const result = formatRowsForCsv({
        displayedColumnNames: ['bytes_transferred', 'weird-column'],
        indexPattern: mockIndexPattern,
      })(mockRow1);
      expect(result).toEqual([mockRow1._source.bytes_transferred, '']);
    });
  });

  describe('saveDataAsCsv', () => {
    afterEach(() => {
      (saveAs as jest.MockedFunction<any>).mockClear();
    });

    it('correctly saves file with correct fileName', () => {
      saveDataAsCsv('someCsvData');
      expect(saveAs).toHaveBeenCalledWith(
        expect.anything(),
        `opensearch_export_${moment().format('YYYY-MM-DD')}`
      );
    });
  });

  describe('useDiscoverDownloadCsv', () => {
    const mockDisplayedColumnNames = ['bytes_transferred', 'category'];
    const mockFetchForMaxCsvOption = jest.fn(() => mockRows);
    const mockUnparse = jest.fn(() => 'someString');

    beforeEach(() => {
      (useDiscoverContext as jest.MockedFunction<any>).mockImplementation(() => ({
        fetchForMaxCsvOption: mockFetchForMaxCsvOption,
      }));
      (useSelector as jest.MockedFunction<any>).mockImplementation(() => mockDisplayedColumnNames);
      (unparse as jest.MockedFunction<any>).mockImplementation(mockUnparse);
    });

    afterEach(() => {
      (useDiscoverContext as jest.MockedFunction<any>).mockClear();
      (saveAs as jest.MockedFunction<any>).mockClear();
      (useSelector as jest.MockedFunction<any>).mockClear();
      (unparse as jest.MockedFunction<any>).mockClear();
      mockFetchForMaxCsvOption.mockClear();
      mockOnLoading.mockClear();
      mockOnSuccess.mockClear();
      mockOnError.mockClear();
    });

    it('isLoading is initially set to false', () => {
      const {
        result: { current },
      } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      expect(current.isLoading).toBeFalsy();
    });

    it('calling downloadCsvForOption will not set loading to true when option is Visible', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Visible);
      });
      result.all.map((resultIteration) => {
        expect(
          (resultIteration as ReturnType<typeof useDiscoverDownloadCsv>).isLoading
        ).toBeFalsy();
      });
    });

    it('calling downloadCsvForOption calls onLoading() when Visible option is selected', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Visible);
      });
      expect(mockOnLoading).not.toHaveBeenCalled();
    });

    it('calling downloadCsvForOption momentarily sets loading to true and then back to false when Max option is selected', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      // check the second last one as the last one turns it back to false
      expect(
        (result.all[result.all.length - 2] as ReturnType<typeof useDiscoverDownloadCsv>).isLoading
      ).toBeTruthy();
      expect(result.current.isLoading).toBeFalsy();
    });

    it('calling downloadCsvForOption calls onLoading() when Max option is selected', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(mockOnLoading).toHaveBeenCalled();
    });

    it('does not call fetchForMaxCsvOption when downloadCsvForOption is called with DownloadCsvFormId.Visible', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Visible);
      });
      expect(mockFetchForMaxCsvOption).not.toHaveBeenCalled();
    });

    it('calls fetchForMaxCsvOption with hits if option is Max and hits < MAX_DOWNLOAD_CSV_COUNT', async () => {
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(mockFetchForMaxCsvOption).toHaveBeenCalledWith(mockHits);
    });

    it('calls fetchForMaxCsvOption with MAX_DOWNLOAD_CSV_COUNT if option is Max and hits > MAX_DOWNLOAD_CSV_COUNT', async () => {
      const { result } = renderHook(() =>
        useDiscoverDownloadCsv({
          ...mockProps,
          hits: MAX_DOWNLOAD_CSV_COUNT + 100,
        })
      );
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(mockFetchForMaxCsvOption).toHaveBeenCalledWith(MAX_DOWNLOAD_CSV_COUNT);
    });

    it('uses rows provided by props if option is visible', async () => {
      const { result } = renderHook(() =>
        useDiscoverDownloadCsv({
          ...mockProps,
          rows: [mockRow1],
        })
      );
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Visible);
      });
      expect(unparse).toHaveBeenCalledWith(
        {
          fields: mockDisplayedColumnNames,
          data: [[mockRow1._source.bytes_transferred, mockRow1._source.category]],
        },
        expect.anything()
      );
    });

    it('uses rows provided by fetchForMaxCsvOption if option is Max', async () => {
      const { result } = renderHook(() =>
        useDiscoverDownloadCsv({
          ...mockProps,
          rows: [mockRow1],
        })
      );
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(unparse).toHaveBeenCalledWith(
        {
          fields: mockDisplayedColumnNames,
          data: [
            [mockRow1._source.bytes_transferred, mockRow1._source.category],
            [mockRow2._source.bytes_transferred, mockRow2._source.category],
          ],
        },
        expect.anything()
      );
    });

    it('calls onSuccess if successful download', async () => {
      const { result } = renderHook(() =>
        useDiscoverDownloadCsv({
          ...mockProps,
        })
      );
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Visible);
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('calls onError if !hits and Max option', async () => {
      const { result } = renderHook(() =>
        useDiscoverDownloadCsv({
          ...mockProps,
          hits: undefined,
        })
      );
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('does not call onError if !hits and Max option', async () => {
      (useDiscoverContext as jest.MockedFunction<any>).mockImplementation(() => ({
        fetchForMaxCsvOption: () => {
          throw new AbortError();
        },
      }));
      const { result } = renderHook(() => useDiscoverDownloadCsv(mockProps));
      await act(async () => {
        await result.current.downloadCsvForOption(DownloadCsvFormId.Max);
      });
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
