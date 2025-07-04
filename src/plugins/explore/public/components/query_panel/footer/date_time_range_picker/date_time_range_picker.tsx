/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSuperDatePicker } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { UI_SETTINGS } from '../../../../../../data/public';
import { ExploreServices } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { runQueryActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../../utils';

export const DateTimeRangePicker = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { timeFilter, handleTimeChange, handleRefreshChange } = useTimeFilter();

  const onRunQuery = () => {
    dispatch(runQueryActionCreator(services));
  };

  return (
    <EuiSuperDatePicker
      start={timeFilter.getTime().from}
      end={timeFilter.getTime().to}
      isPaused={timeFilter.getRefreshInterval().pause}
      refreshInterval={timeFilter.getRefreshInterval().value}
      onTimeChange={handleTimeChange}
      onRefresh={onRunQuery}
      onRefreshChange={handleRefreshChange}
      showUpdateButton={false}
      commonlyUsedRanges={services.uiSettings
        .get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
        .map(({ from, to, display }: { from: string; to: string; display: string }) => ({
          start: from,
          end: to,
          label: display,
        }))}
      dateFormat={services.uiSettings.get('dateFormat')}
      compressed={true}
      data-test-subj="exploreDateTimeRangePicker"
    />
  );
};
