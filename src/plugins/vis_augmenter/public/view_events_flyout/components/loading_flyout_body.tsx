/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlyoutBody, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';

export function LoadingFlyoutBody() {
  return (
    <EuiFlyoutBody>
      <EuiFlexGroup justifyContent="spaceAround">
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" data-test-subj="loadingSpinner" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutBody>
  );
}
