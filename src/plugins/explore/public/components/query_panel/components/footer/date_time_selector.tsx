/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Move this to  already configured datetime range picker
// This component will be fully functional once integrated with query services.

import React, { useState } from 'react';
import { EuiSuperDatePicker } from '@elastic/eui';

export const DateTimeRangePicker: React.FC = () => {
  const [start, setStart] = useState('now-15m');
  const [end, setEnd] = useState('now');
  const [isLoading, setIsLoading] = useState(false);

  const onTimeChange = ({ start: newStart, end: newEnd }: { start: string; end: string }) => {
    setStart(newStart);
    setEnd(newEnd);
  };

  const onRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate a refresh delay
  };

  return (
    <EuiSuperDatePicker
      start={start}
      end={end}
      onTimeChange={onTimeChange}
      onRefresh={onRefresh}
      showUpdateButton={false}
      isLoading={isLoading}
      data-test-subj="queryPanelFooterDateTimeRangePicker"
      compressed={true}
    />
  );
};
