/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { generatePageSizeOptions } from './page_size_options';
export interface Props {
  pageSizeLimit: number;
  rowCount: number;
}

export const usePagination = ({ rowCount, pageSizeLimit }: Props) => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const pageCount = useMemo(() => Math.ceil(rowCount / pagination.pageSize), [
    rowCount,
    pagination,
  ]);

  const pageSizeOptions = generatePageSizeOptions(pageSizeLimit);

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
            pageSizeOptions,
          }
        : undefined,
    [pagination, onChangeItemsPerPage, onChangePage, pageCount, pageSizeOptions]
  );
};
