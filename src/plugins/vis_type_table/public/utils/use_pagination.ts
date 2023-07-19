/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableVisParams } from '../types';

export const usePagination = (visParams: TableVisParams, nRow: number) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: Math.min(visParams.perPage || 0, nRow),
  });
  const onChangeItemsPerPage = useCallback(
    (pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 })),
    [setPagination]
  );
  const onChangePage = useCallback((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [
    setPagination,
  ]);

  useEffect(() => {
    const perPage = Math.min(visParams.perPage || 0, nRow);
    const maxiPageIndex = Math.ceil(nRow / perPage) - 1;
    setPagination((p) => ({
      pageIndex: p.pageIndex > maxiPageIndex ? maxiPageIndex : p.pageIndex,
      pageSize: perPage,
    }));
  }, [nRow, visParams.perPage]);

  return useMemo(
    () =>
      pagination.pageSize
        ? {
            ...pagination,
            onChangeItemsPerPage,
            onChangePage,
          }
        : undefined,
    [pagination, onChangeItemsPerPage, onChangePage]
  );
};
