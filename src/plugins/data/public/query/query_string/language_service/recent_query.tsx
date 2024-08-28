/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_recent_query.scss';

import {
  EuiBasicTable,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCopy,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import moment from 'moment';

import React, { useCallback, useEffect, useState } from 'react';
import { Query, TimeRange } from 'src/plugins/data/common';
import { QueryStringContract } from '../query_string_manager';

// TODO: Need to confirm this number
export const MAX_RECENT_QUERY_SIZE = 10;

interface RecentQueryItem {
  query: Query;
  time: number;
  timeRange?: TimeRange;
}

export function RecentQuery(props: {
  queryString: QueryStringContract;
  query: Query;
  onClickRecentQuery: (query: Query, timeRange?: TimeRange) => void;
}) {
  const [recentQueries, setRecentQueries] = useState<RecentQueryItem[]>(
    props.queryString.getQueryHistory()
  );
  const [isPopoverOpen, setPopover] = useState(false);
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const clearHistory = useCallback(() => {
    props.queryString?.clearQueryHistory();
    setRecentQueries(props.queryString?.getQueryHistory());
  }, [props.queryString]);

  const clear = () => {
    clearHistory();
  };

  useEffect(() => {
    const done = props.queryString.changeQueryHistory(setRecentQueries);
    return () => done();
  }, [props.queryString]);

  const getRowProps = (item: any) => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      className: 'customRowClass',
      onClick: () => {},
    };
  };

  const getCellProps = (item: any, column: any) => {
    const { id } = item;
    const { field } = column;
    return {
      className: 'customCellClass',
      'data-test-subj': `cell-${id}-${field}`,
      textOnly: true,
    };
  };

  const actions = [
    {
      name: 'Run',
      description: 'Run recent query',
      icon: 'play',
      type: 'icon',
      onClick: (item) => {
        props.onClickRecentQuery(recentQueries[item.id].query, recentQueries[item.id].timeRange);
        setPopover(false);
      },
      'data-test-subj': 'action-run',
    },
    {
      render: (item) => {
        return (
          <EuiCopy textToCopy={item.query}>
            {(copy) => (
              <EuiButtonIcon
                onClick={copy}
                iconType="copyClipboard"
                aria-label="Copy recent query"
              />
            )}
          </EuiCopy>
        );
      },
    },
  ];

  const tableColumns = [
    {
      field: 'query',
      name: 'Recent query',
    },
    {
      field: 'language',
      name: 'Language',
    },
    {
      field: 'time',
      name: 'Last run',
    },
    { name: 'Actions', actions },
  ];

  const recentQueryItems = recentQueries
    .filter((item, idx) => idx < MAX_RECENT_QUERY_SIZE)
    .map((query, idx) => {
      const date = moment(query.time);

      const formattedDate = date.format('MMM D, YYYY HH:mm:ss');

      let queryLanguage = query.query.language;
      if (queryLanguage === 'kuery') {
        queryLanguage = 'DQL';
      }

      const tableItem = {
        id: idx,
        query: query.query.query,
        timeRange: query.timeRange,
        language: queryLanguage,
        time: formattedDate,
      };

      return tableItem;
    });

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty iconSide="left" iconType="clock" size="xs" onClick={onButtonClick}>
          <EuiText size="xs" color="subdued">
            {'Recent queries'}
          </EuiText>
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      panelPaddingSize="none"
      anchorPosition={'downRight'}
    >
      <EuiBasicTable
        items={recentQueryItems}
        rowHeader="query"
        columns={tableColumns}
        rowProps={getRowProps}
        cellProps={getCellProps}
        className="recentQuery__table"
      />
    </EuiPopover>
  );
}
