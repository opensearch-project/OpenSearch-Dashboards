/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner, EuiOverlayMask } from '@elastic/eui';

export const LoadingMask = () => {
  return (
    <EuiOverlayMask>
      <EuiLoadingSpinner size="xl" />
    </EuiOverlayMask>
  );
};
