/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';

export const usePagination = (rowCount: number) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const pageCount = useMemo(() => Math.ceil(rowCount / pagination.pageSize), [
    rowCount,
    pagination,
  ]);

  const onChangeItemsPerPage = useCallback(
    (pageSize: number) => setPagination((p) => ({ ...p, pageSize })),
    []
  );

  const onChangePage = useCallback(
    (pageIndex: number) => setPagination((p) => ({ ...p, pageIndex })),
    []
  );

  return useMemo(
    () =>
      pagination.pageSize
        ? {
            ...pagination,
            onChangeItemsPerPage,
            onChangePage,
            pageIndex: pagination.pageIndex > pageCount - 1 ? 0 : pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageSizeOptions: [25, 50, 100], // TODO: make this configurable
          }
        : undefined,
    [pagination, onChangeItemsPerPage, onChangePage, pageCount]
  );
};
