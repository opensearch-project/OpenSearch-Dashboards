/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CriteriaWithPagination,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiCodeBlock,
  RIGHT_ALIGNMENT,
} from '@elastic/eui';
import { createPortal } from 'react-dom';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';
import { ActionBar } from './action_bar/action_bar';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';

const STATISTICS_PAGE_SIZE = 100;

export const StatisticsTab = React.memo(() => {
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<Record<string, JSX.Element>>(
    {}
  );
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const { results } = useTabResults();

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  const onTableChange = useCallback(({ page }: CriteriaWithPagination<Record<string, any>>) => {
    const { index } = page;
    setPageIndex(index);
  }, []);

  const toggleDetails = useCallback((item: { id: string }) => {
    const { id, ...rest } = item;
    setItemIdToExpandedRowMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = (
          <EuiCodeBlock language="json">{JSON.stringify(rest, undefined, 2)}</EuiCodeBlock>
        );
      }
      return next;
    });
  }, []);

  const columns = useMemo(() => {
    const cols: Array<EuiBasicTableColumn<Record<string, any>>> = [];
    if (results) {
      const schema = results.fieldSchema || [];

      for (const { name } of schema) {
        if (name) {
          cols.push({
            name,
            field: name,
            truncateText: true,
          });
        }
      }
      cols.push({
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: (item: any) => (
          <EuiButtonIcon
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleDetails(item);
            }}
            aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      });
    }
    return cols;
  }, [itemIdToExpandedRowMap, results, toggleDetails]);

  const rows = useMemo(() => {
    if (results) {
      const hits = results.hits?.hits || [];
      const schema = results.fieldSchema || [];

      const transformedData = hits.map((row, i) => {
        const transformedRow: Record<string, any> = {};
        transformedRow.id = i;
        for (const { name } of schema) {
          const source = row._source as Record<string, any>;
          if (name) {
            transformedRow[name] = source[name];
          }
        }
        return transformedRow;
      });
      return transformedData;
    }
    return [];
  }, [results]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize: STATISTICS_PAGE_SIZE,
      totalItemCount: rows.length,
      hidePerPageOptions: true,
    }),
    [pageIndex, rows.length]
  );

  const pageOfItems = useMemo(
    () =>
      rows.slice(
        pageIndex * STATISTICS_PAGE_SIZE,
        pageIndex * STATISTICS_PAGE_SIZE + STATISTICS_PAGE_SIZE
      ),
    [pageIndex, rows]
  );

  const getRowProps = useCallback(
    (item: { id: string }) => ({
      onClick: () => toggleDetails(item),
      style: { cursor: 'pointer' },
    }),
    [toggleDetails]
  );

  return (
    <div className="explore-statistic-tab tab-container">
      {slot && createPortal(<ActionBar />, slot)}
      <EuiBasicTable
        className="exploreStatisticTable"
        items={pageOfItems}
        itemId="id"
        columns={columns}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        tableLayout="auto"
        cellProps={{ style: { whiteSpace: 'nowrap', maxWidth: '200px' } }}
        pagination={pagination}
        onChange={onTableChange}
        rowProps={getRowProps}
      />
    </div>
  );
});
