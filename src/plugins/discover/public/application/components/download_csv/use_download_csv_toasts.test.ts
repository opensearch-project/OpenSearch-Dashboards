/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import {
  useDiscoverDownloadCsvToasts,
  DiscoverDownloadCsvToastId,
} from './use_download_csv_toasts';

describe('useDiscoverDownloadCsvToasts', () => {
  it('toasts are initially empty', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    expect(result.current.toasts).toHaveLength(0);
  });

  it('calling onLoading adds loading toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onLoading();
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(DiscoverDownloadCsvToastId.Loading);
  });

  it('calling onSuccess adds success toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onSuccess();
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(DiscoverDownloadCsvToastId.Success);
  });

  it('calling onError adds error toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onError();
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(DiscoverDownloadCsvToastId.Error);
  });

  it('calling multiple toasts still only renders one toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onSuccess();
    result.current.onError();
    result.current.onLoading();
    expect(result.current.toasts).toHaveLength(1);
  });

  it('calling onDismiss clears toast', () => {
    const { result } = renderHook(useDiscoverDownloadCsvToasts);
    result.current.onSuccess();
    result.current.onDismiss();
    expect(result.current.toasts).toHaveLength(0);
  });
});
