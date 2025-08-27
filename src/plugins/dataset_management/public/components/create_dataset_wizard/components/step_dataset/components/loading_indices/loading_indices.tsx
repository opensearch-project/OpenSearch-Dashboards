/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiLoadingSpinner } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

export const LoadingIndices = ({ ...rest }) => (
  <EuiFlexGroup
    justifyContent="center"
    alignItems="center"
    direction="column"
    gutterSize="s"
    {...rest}
  >
    <EuiFlexItem grow={false}>
      <EuiTitle size="s">
        <h3 className="eui-textCenter">
          <FormattedMessage
            id="datasetManagement.createDataset.step.loadingHeader"
            defaultMessage="Looking for matching indices…"
          />
        </h3>
      </EuiTitle>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiLoadingSpinner size="l" />
    </EuiFlexItem>
  </EuiFlexGroup>
);
