/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Move this to  already configured datetime range picker
// This component will be fully functional once integrated with query services.

import React from 'react';
import { EuiSuperDatePicker } from '@elastic/eui';
import { UI_SETTINGS } from '../../../../../../data/public';
import { ExploreServices } from '../../../../types';

export interface DatePickerProps {
  datePickerRef?: React.RefObject<HTMLDivElement>;
  services: ExploreServices;
  timefilter: any;
  onTimeChange: (time: { start: string; end: string }) => void;
  onRunQuery: () => void;
  oneRefreshChange: (refresh: { isPaused: boolean; refreshInterval: number }) => void;
}

export const DateTimeRangePicker: React.FC<DatePickerProps> = ({
  datePickerRef,
  services,
  timefilter,
  onTimeChange,
  onRunQuery,
  oneRefreshChange,
}) => {
  return (
    <div ref={datePickerRef} key="datePicker">
      <EuiSuperDatePicker
        key="datePicker"
        start={timefilter?.getTime().from}
        end={timefilter?.getTime().to}
        isPaused={timefilter?.getRefreshInterval().pause}
        refreshInterval={timefilter?.getRefreshInterval().value}
        onTimeChange={onTimeChange}
        onRefresh={onRunQuery}
        onRefreshChange={oneRefreshChange}
        showUpdateButton={false}
        commonlyUsedRanges={services?.uiSettings
          ?.get(UI_SETTINGS.TIMEPICKER_QUICK_RANGES)
          ?.map(({ from, to, display }: { from: string; to: string; display: string }) => ({
            start: from,
            end: to,
            label: display,
          }))}
        dateFormat={services?.uiSettings?.get('dateFormat')}
        compressed={true}
        data-test-subj="queryPanelFooterDateTimeRangePicker"
      />
    </div>
  );
};
