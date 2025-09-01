/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_index.scss';

import React, { useEffect, useState } from 'react';
import { EuiBasicTable, EuiBasicTableColumn, EuiButtonIcon, EuiCopy } from '@elastic/eui';
import moment from 'moment';
import { RecentQueriesTableProps, RecentQueryItem, RecentQueryTableItem } from '../types';

export const MAX_RECENT_QUERY_SIZE = 10;

export function RecentQueriesTable({
  queryString,
  onClickRecentQuery,
  isVisible,
}: RecentQueriesTableProps) {
  const currentLanguage = queryString.getQuery().language;
  const [recentQueries, setRecentQueries] = useState<RecentQueryItem[]>(
    queryString.getQueryHistory()
  );

  useEffect(() => {
    const done = queryString.changeQueryHistory(setRecentQueries);
    return () => done();
  }, [queryString]);

  const getRowProps = (item: any) => ({
    'data-test-subj': `row-${item.id}`,
    className: 'customRowClass',
    onClick: () => {},
  });

  const getCellProps = (item: any, column: any) => ({
    className: 'customCellClass',
    'data-test-subj': `cell-${item.id}-${column.field}`,
    textOnly: true,
  });

  const tableColumns: Array<EuiBasicTableColumn<RecentQueryTableItem>> = [
    { field: 'query', name: 'Recent query' },
    { field: 'time', name: 'Last run', width: '200px' },
    {
      name: 'Actions',
      actions: [
        {
          name: 'Run',
          description: 'Run recent query',
          icon: 'play',
          type: 'icon',
          onClick: (item: RecentQueryTableItem) => {
            onClickRecentQuery(
              recentQueries.find((recentQuery) => recentQuery.id === item.id)?.query!,
              recentQueries.find((recentQuery) => recentQuery.id === item.id)?.timeRange
            );
          },
          'data-test-subj': 'action-run',
        },
        {
          render: (item: RecentQueryTableItem) => (
            <EuiCopy textToCopy={item.query as string}>
              {(copy) => (
                <EuiButtonIcon
                  onClick={copy}
                  iconType="copyClipboard"
                  aria-label="Copy recent query"
                />
              )}
            </EuiCopy>
          ),
        },
      ],
      width: '70px',
    },
  ];

  const recentQueryItems: RecentQueryTableItem[] = recentQueries
    .filter((item, idx) => idx < MAX_RECENT_QUERY_SIZE)
    .filter((item) => item.query.language === currentLanguage)
    .map((query) => ({
      id: query.id,
      query: query.query.query,
      timeRange: query.timeRange,
      time: moment(query.time).format('MMM D, YYYY HH:mm:ss'),
    }));

  if (!isVisible) return null;

  return (
    <EuiBasicTable
      items={recentQueryItems}
      rowHeader="query"
      columns={tableColumns}
      rowProps={getRowProps}
      cellProps={getCellProps}
      className="recentQuery__table"
      data-test-subj="recentQueryTable"
      tableLayout="fixed"
      compressed
    />
  );
}
