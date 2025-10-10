/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { FieldStatsItem, DateRange } from '../field_stats_types';
import { DEFAULT_DATE_FORMAT } from '../constants';

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
