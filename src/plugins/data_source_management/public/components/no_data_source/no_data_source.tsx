/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiButtonEmpty } from '@elastic/eui';




export const NoDataSource = () => {
  const label = "    No data sources";

  return (
    <EuiButtonEmpty
              className="euiHeaderLink"
              data-test-subj="dataSourceViewContextMenuHeaderLink"
              iconType="alert"
              iconSide="left"
              size="s"
              color='warning'
            >
              {label}
            </EuiButtonEmpty>
  );
};
