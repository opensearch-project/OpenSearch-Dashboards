/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { DiscoverServices } from '../../../build_services';
import { SAMPLE_SIZE_SETTING } from '../../../../common';
import { generatePageSizeOptions } from './page_size_options';
export interface Props {
  services: DiscoverServices;
  rowCount: number;
}

export const usePagination = ({ rowCount, services }: Props) => {
  const { uiSettings } = services;

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const pageCount = useMemo(() => Math.ceil(rowCount / pagination.pageSize), [
    rowCount,
    pagination,
  ]);
  const sampleSize = uiSettings.get(SAMPLE_SIZE_SETTING);

  const pageSizeOptions = generatePageSizeOptions(sampleSize);

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
