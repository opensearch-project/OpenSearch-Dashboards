/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import { ViewProps } from '../../../../../data_explorer/public';

// eslint-disable-next-line import/no-default-export
export default function VisBuilderPanel(props: ViewProps) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
    >
      <EuiLoadingSpinner size="l" />
    </div>
  );
}
