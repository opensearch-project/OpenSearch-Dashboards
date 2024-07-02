/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSpacer, EuiText, EuiTitle, EuiHorizontalRule } from '@elastic/eui';
import React from 'react';

export const NewDatasourceDescription = () => {
  return (
    <div>
      <EuiTitle size="s">
        <h2>Create a new data source</h2>
      </EuiTitle>

      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Connect to a compatible data source or compute engine to bring your data into OpenSearch and
        OpenSearch Dashboards.
      </EuiText>
      <EuiHorizontalRule size="full" />
    </div>
  );
};
