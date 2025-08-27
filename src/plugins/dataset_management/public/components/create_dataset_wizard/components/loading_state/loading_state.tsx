/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiTitle } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

export const LoadingState = () => (
  <EuiFlexGroup justifyContent="center" alignItems="center" direction="column" gutterSize="s">
    <EuiFlexItem grow={false}>
      <EuiTitle size="s">
        <h2 style={{ textAlign: 'center' }}>
          <FormattedMessage
            id="datasetManagement.createDataset.loadingState.checkingLabel"
            defaultMessage="Checking for OpenSearch data"
          />
        </h2>
      </EuiTitle>
    </EuiFlexItem>

    <EuiFlexItem grow={false}>
      <EuiLoadingSpinner size="l" />
    </EuiFlexItem>
  </EuiFlexGroup>
);
