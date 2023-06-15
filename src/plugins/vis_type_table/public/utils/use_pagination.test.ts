/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { AggTypes, TableVisParams } from '../types';
import { usePagination } from './use_pagination';

describe('usePagination', () => {
  const visParams = {
    perPage: 10,
    showPartialRows: false,
    showMetricsAtAllLevels: false,
    showTotal: false,
    totalFunc: AggTypes.SUM,
    percentageCol: '',
  } as TableVisParams;

  it('should not set pagination if perPage is empty string', () => {
    const params = {
      ...visParams,
      perPage: '',
    };
    const { result } = renderHook(() => usePagination(params, 20));
    expect(result.current).toEqual(undefined);
  });

  it('should init pagination', () => {
    const { result } = renderHook(() => usePagination(visParams, 20));
    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 10,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
    });
  });

  it('should init pagination with pageSize as the minimum of perPage and nRow', () => {
    const { result } = renderHook(() => usePagination(visParams, 8));
    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 8,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
    });
  });

  it('should set pageSize to the lesser of perPage and nRow when nRow is less than perPage', () => {
    const { result } = renderHook(() => usePagination(visParams, 5));
    expect(result.current).toEqual({
      pageIndex: 0,
      pageSize: 5,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
    });
  });

  it('should set page index via onChangePage', () => {
    const { result } = renderHook(() => usePagination(visParams, 50));
    act(() => {
      // set page index to 3
      result.current?.onChangePage(3);
    });
    expect(result.current?.pageIndex).toEqual(3);
  });

  it('should set to max page index via onChangePage if exceed maxiPageIndex', () => {
    const { result, rerender } = renderHook((props) => usePagination(props.visParams, props.nRow), {
      initialProps: {
        visParams,
        nRow: 55,
      },
    });

    act(() => {
      // set page index to the last page
      result.current?.onChangePage(5);
    });

    rerender({ visParams, nRow: 15 });
    // when the number of rows decreases, page index should
    // be set to maxiPageIndex
    expect(result.current).toEqual({
      pageIndex: 1,
      pageSize: 10,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
    });
  });

  it('should pagination via onChangeItemsPerPage', () => {
    const { result } = renderHook(() => usePagination(visParams, 20));
    act(() => {
      // set page size to 5
      result.current?.onChangeItemsPerPage(5);
    });

    expect(result.current?.pageSize).toEqual(5);
  });
});
