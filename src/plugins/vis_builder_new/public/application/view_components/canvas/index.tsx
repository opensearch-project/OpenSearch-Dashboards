/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import { ViewProps } from '../../../../../data_explorer/public';

// eslint-disable-next-line import/no-default-export
export default function VisBuilderCanvas(props: ViewProps) {
  return <EuiLoadingSpinner size="l" />;
}
