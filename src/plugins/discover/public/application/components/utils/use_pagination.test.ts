/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { usePagination } from './use_pagination';

describe('usePagination', () => {
  it('should initialize correctly with visParams and nRow', () => {
    const nRow = 30;
    const { result } = renderHook(() => usePagination(nRow));

    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 100,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
      pageSizeOptions: [25, 50, 100],
    });
  });

  it('should update pageSize correctly when calling onChangeItemsPerPage', () => {
    const nRow = 30;
    const { result } = renderHook(() => usePagination(nRow));

    act(() => {
      result.current?.onChangeItemsPerPage(20);
    });

    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 20,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
      pageSizeOptions: [25, 50, 100],
    });
  });

  it('should update pageIndex correctly when calling onChangePage', () => {
    const nRow = 30;
    const { result } = renderHook(() => usePagination(nRow));

    act(() => {
      result.current?.onChangePage(1);
    });

    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 100,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
      pageSizeOptions: [25, 50, 100],
    });
  });

  it('should correct pageIndex if it exceeds maximum page index after nRow or perPage change', () => {
    const nRow = 300;
    const { result } = renderHook(() => usePagination(nRow));

    act(() => {
      result.current?.onChangePage(4);
    });

    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 100,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
      pageSizeOptions: [25, 50, 100],
    });
  });
});
