/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { usePatternsFlyout } from '../patterns_flyout_context';

export interface PatternsFlyoutRecord {
  pattern: string;
  count: number;
  sample: string;
}

export const PatternsTableFlyout = () => {
  const { patternsFlyoutData: record, closePatternsTableFlyout } = usePatternsFlyout();
  // TODO: when patternsFlyoutData is undefined, do we then put on a spinner for the loading state?

  return (
    <EuiFlyout onClose={closePatternsTableFlyout}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>Inspect pattern</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText>
                <p>pattern: {record?.pattern}</p>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
