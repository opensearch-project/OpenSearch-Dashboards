/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriteriaWithPagination, EuiBasicTable, EuiCallOut } from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  selectDataset,
  selectPatternsField,
  selectQuery,
  selectUsingRegexPatterns,
} from '../../../application/utils/state_management/selectors';
import { ExploreServices } from '../../../types';
import { SAMPLE_SIZE_SETTING } from '../../../../common';
import { prepareQueryForLanguage } from '../../../application/utils/languages';
import { createSearchPatternQueryWithSlice } from '../utils/utils';

interface PatternsFlyoutEventTableProps {
  patternString: string;
  totalItemCount: number;
}

interface EventTableItem {
  timestamp?: string;
  event: string;
}

const EVENT_TABLE_PAGE_SIZE = 10;

export const PatternsFlyoutEventTable = ({
  patternString,
  totalItemCount,
}: PatternsFlyoutEventTableProps) => {
  const dataset = useSelector(selectDataset);
  const query = useSelector(selectQuery);
  const patternsField = useSelector(selectPatternsField);
  const usingRegexPatterns = useSelector(selectUsingRegexPatterns);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const timeFieldName = dataset?.timeFieldName;

  const [fetchError, setFetchError] = useState<unknown | null>(null);

  if (!dataset || !patternsField)
    throw new Error('Dataset or patterns field is not appearing for event table');

  const [fetchedItems, setFetchedItems] = useState<EventTableItem[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);

  const eventResults = async (page: number) => {
    /**
     * Below logic queries similar to how its done in query_actions
     */
    try {
      const searchSource = await services.data.search.searchSource.create();

      // fetch the dataView from the dataset.id, check cache for non-index patterns
      const dataView = await services.data.dataViews.get(
        dataset.id,
        dataset.type !== 'INDEX_PATTERN'
      );
      const filters = services.data.query.filterManager.getFilters();
      const size = services.uiSettings.get(SAMPLE_SIZE_SETTING);

      const querySource = prepareQueryForLanguage(query);

      const modifiedQuerySource = {
        ...querySource,
        query: createSearchPatternQueryWithSlice(
          querySource,
          patternsField,
          usingRegexPatterns,
          patternString,
          timeFieldName,
          EVENT_TABLE_PAGE_SIZE,
          page * EVENT_TABLE_PAGE_SIZE
        ),
      };

      searchSource.setFields({
        index: dataView,
        size,
        query: modifiedQuerySource,
        highlightAll: true,
        version: true,
        filter: filters,
      });

      const results = await searchSource.fetch();
      const rows = results.hits.hits;

      const items: EventTableItem[] = rows.map((row) => {
        const item: EventTableItem = {
          event: row._source[patternsField],
        };

        if (timeFieldName) {
          item.timestamp = row._source[timeFieldName];
        }

        return item;
      });

      setFetchedItems(items);
    } catch (error) {
      setFetchError(error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    setTableLoading(true);
    eventResults(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventTableColumns = useMemo(() => {
    const columns = [];

    if (timeFieldName) {
      columns.push({
        field: 'timestamp',
        name: i18n.translate('explore.patterns.flyout.timeColumnName', {
          defaultMessage: 'Time ({timeFieldName})',
          values: { timeFieldName },
        }),
        sortable: false,
      });
    }

    columns.push({
      field: 'event',
      name: i18n.translate('explore.patterns.flyout.eventsColumnName', {
        defaultMessage: 'Event ({patternsField})',
        values: { patternsField },
      }),
      sortable: false,
    });

    return columns;
  }, [timeFieldName, patternsField]);

  return fetchError ? (
    <EuiCallOut title="Error fetching events" color="danger" iconType="alert">
      {fetchError.toString()}
    </EuiCallOut>
  ) : (
    <EuiBasicTable
      aria-label={i18n.translate('explore.patterns.flyout.eventTable', {
        defaultMessage: 'Pattern event table',
      })}
      items={fetchedItems}
      columns={eventTableColumns}
      tableLayout="auto"
      pagination={{
        pageIndex,
        pageSize: EVENT_TABLE_PAGE_SIZE,
        totalItemCount,
        hidePerPageOptions: true,
      }}
      onChange={({ page: { index } }: CriteriaWithPagination<EventTableItem>) => {
        setTableLoading(true);
        setPageIndex(index);
        eventResults(index);
      }}
      loading={tableLoading}
    />
  );
};
