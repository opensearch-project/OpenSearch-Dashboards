/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import { ViewProps } from '../../../../../data_explorer/public';
import { useUiSelector } from '../../utils/state_management';

// eslint-disable-next-line import/no-default-export
export default function VisBuilderCanvas(props: ViewProps) {
  const allState = useUiSelector((state) => state);
  return <EuiLoadingSpinner size="l" />;
}
