/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import moment from 'moment';
import { EuiBasicTable, EuiBasicTableColumn, EuiButtonIcon, EuiCopy } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { RecentQueriesTableProps, RecentQueryItem, RecentQueryTableItem } from '../../../types';
import { LanguageType } from '../../../types';

export const MAX_RECENT_QUERY_SIZE = 10;

// TODO: This component will be fully functional once integrated with query services.

export function RecentQueriesTable({
  onClickRecentQuery,
  isVisible,
  languageType, // TODO: Integrate the langType with filter if required once integration done
}: RecentQueriesTableProps) {
  // Mock recent queries data
  // TODO: Remove this once session queries integrated
  const recentQueries: RecentQueryItem[] = [
    {
      id: 1,
      query: {
        query: 'source=logs | where status=200',
        language: LanguageType.PPL,
        prompt: 'Get logs with status 200',
      },

      timeRange: { from: 'now-15m', to: 'now' },
      time: Date.now() - 86400000,
    },
    {
      id: 2,
      query: {
        query: 'source=metrics | stats avg(cpu) by host',
        language: LanguageType.PPL,
        prompt: 'Give me the average CPU usage by host',
      },

      timeRange: { from: 'now-1h', to: 'now' },
      time: Date.now() - 86400000,
    },
    {
      id: 3,
      query: {
        query: 'source=metrics | where error=500',
        language: LanguageType.KeyValue,
        prompt: 'Give me the average CPU usage by host',
      },
      timeRange: { from: 'now-24h', to: 'now' },
      time: Date.now() - 86400000,
    },
  ];

  // TODO: dispatch action to get recent queries.
  // const [recentQueries, setRecentQueries] = useState<RecentQueryItem[]>(mockRecentQueries);

  const getRowProps = (item: RecentQueryTableItem) => ({
    'data-test-subj': `row-${item.id}`,
    className: 'customRowClass',
    onClick: () => {},
  });

  const getCellProps = (
    item: RecentQueryTableItem,
    column: EuiBasicTableColumn<RecentQueryTableItem>
  ) => ({
    className: 'customCellClass',
    'data-test-subj': `cell-${item.id}-${(column as { field?: string }).field ?? 'actions'}`,
    textOnly: true,
  });

  const tableColumns: Array<EuiBasicTableColumn<RecentQueryTableItem>> = [
    {
      field: 'query',
      name: i18n.translate('explore.queryPanel.recentQueryTable.queryColumn', {
        defaultMessage: 'Recent query',
      }),
    },
    {
      field: 'time',
      name: i18n.translate('explore.queryPanel.recentQueryTable.lastRunColumn', {
        defaultMessage: 'Last run',
      }),
    },
    {
      name: i18n.translate('explore.queryPanel.recentQueryTable.actionsColumn', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          name: i18n.translate('explore.queryPanel.recentQueryTable.runAction', {
            defaultMessage: 'Run',
          }),
          description: i18n.translate('explore.queryPanel.recentQueryTable.runActionDescription', {
            defaultMessage: 'Run recent query',
          }),
          icon: 'play',
          type: 'icon',
          onClick: (item: RecentQueryTableItem) => {
            const foundQuery = recentQueries.find((recentQuery) => recentQuery.id === item.id);
            if (foundQuery) {
              onClickRecentQuery(foundQuery.query, foundQuery.timeRange);
            }
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
                  aria-label={i18n.translate(
                    'explore.queryPanel.recentQueryTable.copyActionAriaLabel',
                    {
                      defaultMessage: 'Copy recent query',
                    }
                  )}
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
      className="queryPanel__footer__recentQueryTable"
      data-test-subj="queryPanelRecentQueryTable"
      tableLayout="fixed"
      compressed
    />
  );
}
