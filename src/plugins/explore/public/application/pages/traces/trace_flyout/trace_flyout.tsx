/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout } from '@elastic/eui';
import React from 'react';
import { useTraceFlyoutContext } from './trace_flyout_context';
import { TraceDetails } from '../trace_details/trace_view';

export const TraceFlyout: React.FC = () => {
  const { closeTraceFlyout, flyoutData, isFlyoutOpen } = useTraceFlyoutContext();

  if (!flyoutData || !isFlyoutOpen) return null;

  return (
    <EuiFlyout data-test-subj="traceFlyout" onClose={closeTraceFlyout} ownFocus={false}>
      <TraceDetails isFlyout={true} />
    </EuiFlyout>
  );
};
