/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { FieldStatsItem, DateRange, DetailSectionConfig } from '../field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';
import { DEFAULT_DATE_FORMAT } from '../constants';

/**
 * Query function to fetch date range
 */
const getDateRangeQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | stats min(\`${fieldName}\`) as earliest,
            max(\`${fieldName}\`) as latest`;
};

/**
 * Component to display date range
 */
interface DateRangeSectionProps {
  data: DateRange;
  field: FieldStatsItem;
}

const DateRangeSection: React.FC<DateRangeSectionProps> = ({ data, field }) => {
  return (
    <EuiDescriptionList
      type="inline"
      listItems={[
        {
          title: i18n.translate('explore.fieldStats.dateRange.earliestLabel', {
            defaultMessage: 'Earliest',
          }),
          description: data.earliest ? moment.utc(data.earliest).format(DEFAULT_DATE_FORMAT) : '—',
        },
        {
          title: i18n.translate('explore.fieldStats.dateRange.latestLabel', {
            defaultMessage: 'Latest',
          }),
          description: data.latest ? moment.utc(data.latest).format(DEFAULT_DATE_FORMAT) : '—',
        },
      ]}
      data-test-subj="dateRangeSection"
    />
  );
};

/**
 * Date Range Detail Section Configuration
 * Displays the earliest and latest dates for date fields
 */
export const dateRangeDetailConfig: DetailSectionConfig<DateRange> = {
  id: 'dateRange',
  title: i18n.translate('explore.fieldStats.dateRange.sectionTitle', {
    defaultMessage: 'Date Range',
  }),
  applicableToTypes: ['date'],
  fetchData: async (fieldName, dataset, services) => {
    const query = getDateRangeQuery(dataset.title, fieldName);
    const result = await executeFieldStatsQuery(services, query, dataset.id || '', dataset.type);

    const hits = result?.hits?.hits || [];
    const range = hits[0]?._source || {};
    return {
      earliest: range.earliest || null,
      latest: range.latest || null,
    };
  },
  component: DateRangeSection,
};
