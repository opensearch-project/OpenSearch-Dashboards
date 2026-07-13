/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout } from '@elastic/eui';
import React from 'react';
import { useTraceFlyoutContext } from './trace_flyout_context';
import { TraceDetails } from '../trace_details/trace_view';
import { getTraceDetailsUrlParams } from '../../../../components/data_table/table_cell/trace_utils/trace_utils';

export const TraceFlyout: React.FC = () => {
  const { closeTraceFlyout, flyoutData, isFlyoutOpen } = useTraceFlyoutContext();

  if (!flyoutData || !isFlyoutOpen) return null;

  const { dataset } = getTraceDetailsUrlParams(
    flyoutData.spanId,
    flyoutData.traceId,
    flyoutData.dataset
  );

  return (
    <EuiFlyout data-test-subj="traceFlyout" onClose={closeTraceFlyout} ownFocus={false}>
      <TraceDetails
        // Remount when the selected trace/span changes so re-selection updates the flyout.
        key={`${dataset.id}:${flyoutData.traceId}:${flyoutData.spanId}`}
        isFlyout={true}
        defaultDataset={dataset}
        defaultTraceId={flyoutData.traceId}
        defaultSpanId={flyoutData.spanId}
      />
    </EuiFlyout>
  );
};
