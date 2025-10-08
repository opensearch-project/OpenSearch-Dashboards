/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { FieldStatsItem, DateRange } from '../field_stats_types';

interface DateRangeSectionProps {
  data: DateRange;
  field: FieldStatsItem;
}

export const DateRangeSection: React.FC<DateRangeSectionProps> = ({ data }) => {
  return (
    <EuiDescriptionList
      type="inline"
      listItems={[
        {
          title: i18n.translate('explore.fieldStats.dateRange.earliestLabel', {
            defaultMessage: 'Earliest',
          }),
          description: data.earliest ? moment(data.earliest).format('YYYY-MM-DD HH:mm:ss') : '—',
        },
        {
          title: i18n.translate('explore.fieldStats.dateRange.latestLabel', {
            defaultMessage: 'Latest',
          }),
          description: data.latest ? moment(data.latest).format('YYYY-MM-DD HH:mm:ss') : '—',
        },
      ]}
      data-test-subj="dateRangeSection"
    />
  );
};
