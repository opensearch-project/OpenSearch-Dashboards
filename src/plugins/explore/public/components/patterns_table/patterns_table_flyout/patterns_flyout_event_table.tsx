/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTable } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  selectDataset,
  selectPatternsField,
  selectQuery,
} from '../../../application/utils/state_management/selectors';
import { ExploreServices } from '../../../types';
import { SAMPLE_SIZE_SETTING } from '../../../../common';
import { getQueryWithSource } from '../../../application/utils/languages';
import { createSearchPatternQueryWithSlice } from '../utils/utils';

export const PatternsFlyoutEventTable = ({ patternString }: { patternString: string }) => {
  const dataset = useSelector(selectDataset);
  const query = useSelector(selectQuery);
  const patternsField = useSelector(selectPatternsField);
  const { services } = useOpenSearchDashboards<ExploreServices>();
  if (!dataset || !patternsField)
    throw new Error('Dataset or patterns field is not appearing for event table');
  const timeFieldName = dataset.timeFieldName;
  if (!timeFieldName) throw new Error('No time field name found in dataset');

  const [fetchedItems, setFetchedItems] = useState<Array<{ timestamp: string; event: string }>>([]);

  const eventResults = async () => {
    const searchSource = await services.data.search.searchSource.create();

    const dataView = await services.data.dataViews.get(
      dataset.id,
      dataset.type !== 'INDEX_PATTERN'
    );
    const filters = services.data.query.filterManager.getFilters();
    const size = services.uiSettings.get(SAMPLE_SIZE_SETTING);

    const querySource = getQueryWithSource(query);

    const modifiedQuerySource = {
      ...querySource,
      query: createSearchPatternQueryWithSlice(
        querySource,
        patternsField,
        false,
        patternString,
        10,
        0
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

    const items = rows.map((row) => {
      return {
        timestamp: row._source[timeFieldName],
        event: row._source[patternsField],
      };
    });

    setFetchedItems(items);
  };

  useEffect(() => {
    eventResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EuiBasicTable
      items={fetchedItems}
      columns={[
        {
          field: 'timestamp',
          name: i18n.translate('explore.patterns.flyout.timeColumnName', {
            defaultMessage: 'Time',
          }),
          sortable: false,
        },
        {
          field: 'event',
          name: i18n.translate('explore.patterns.flyout.eventsColumnName', {
            defaultMessage: 'Event',
          }),
          sortable: false,
        },
      ]}
      tableLayout="auto"
    />
  );
};
