/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

export const PatternsTableFlyout = (record: { pattern: string; count: number; sample: string }) => {
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  return (
    <>
      <EuiButtonIcon iconType={'inspect'} onClick={() => setFlyoutOpen(true)} />

      {flyoutOpen && (
        <EuiFlyout onClose={() => setFlyoutOpen(false)}>
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
                    <p>Pattern:</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
