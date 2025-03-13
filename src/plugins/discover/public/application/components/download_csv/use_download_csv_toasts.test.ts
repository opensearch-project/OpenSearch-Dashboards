/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { getServices } from '../../../opensearch_dashboards_services';
import {
  useDiscoverDownloadCsvToasts,
  DiscoverDownloadCsvToastId,
} from './use_download_csv_toasts';

jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: jest.fn(),
}));

const mockAddInfo = jest.fn();
const mockRemove = jest.fn();
const mockAddSuccess = jest.fn();
const mockAddDanger = jest.fn();

describe('useDiscoverDownloadCsvToasts', () => {
  beforeEach(() => {
    (getServices as jest.MockedFunction<any>).mockImplementation(() => ({
      toastNotifications: {
        addInfo: mockAddInfo,
        remove: mockRemove,
        addSuccess: mockAddSuccess,
        addDanger: mockAddDanger,
      },
    }));
  });

  afterEach(() => {
    (getServices as jest.MockedFunction<any>).mockClear();
    mockAddInfo.mockClear();
    mockRemove.mockClear();
    mockAddSuccess.mockClear();
    mockAddDanger.mockClear();
  });

  it('calling onLoading adds loading toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onLoading();
    expect(mockAddInfo).toHaveBeenCalledWith(
      expect.objectContaining({ id: DiscoverDownloadCsvToastId.Loading }),
      expect.anything()
    );
  });

  it('calling onSuccess adds success toast and closes loading toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onSuccess();
    expect(mockRemove).toHaveBeenCalledWith(DiscoverDownloadCsvToastId.Loading);
    expect(mockAddSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: DiscoverDownloadCsvToastId.Success })
    );
  });

  it('calling onError adds error toast and closes loading toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onError();
    expect(mockRemove).toHaveBeenCalledWith(DiscoverDownloadCsvToastId.Loading);
    expect(mockAddDanger).toHaveBeenCalledWith(
      expect.objectContaining({ id: DiscoverDownloadCsvToastId.Error })
    );
  });
});
