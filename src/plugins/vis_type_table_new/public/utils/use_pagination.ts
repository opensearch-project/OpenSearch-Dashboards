/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableVisConfig } from '../types';

export const usePagination = (visConfig: TableVisConfig, nRow: number) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: visConfig.perPage || 10,
  });
  const onChangeItemsPerPage = useCallback(
    (pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 })),
    [setPagination]
  );
  const onChangePage = useCallback((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [
    setPagination,
  ]);

  useEffect(() => {
    const perPage = visConfig.perPage || 10;
    const maxiPageIndex = Math.ceil(nRow / perPage) - 1;
    setPagination((p) => ({
      pageIndex: p.pageIndex > maxiPageIndex ? maxiPageIndex : p.pageIndex,
      pageSize: perPage,
    }));
  }, [nRow, visConfig.perPage]);

  return useMemo(
    () => ({
      ...pagination,
      onChangeItemsPerPage,
      onChangePage,
    }),
    [pagination, onChangeItemsPerPage, onChangePage]
  );
};
