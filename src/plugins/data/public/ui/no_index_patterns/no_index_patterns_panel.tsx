/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiButton,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';

interface NoIndexPatternsPanelProps {
  onOpenDataSelector: () => void;
}

export const NoIndexPatternsPanel: React.FC<NoIndexPatternsPanelProps> = ({
  onOpenDataSelector,
}) => (
  <EuiFlexGroup justifyContent="center" alignItems="center" style={{ height: '100%' }}>
    <EuiFlexItem grow={false} style={{ width: '100%', maxWidth: '500px' }}>
      <EuiPanel paddingSize="l">
        <EuiFlexGroup direction="column" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiIcon type="dataVisualizer" size="xxl" color="subdued" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText textAlign="center">
              <h2>Select data</h2>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText textAlign="center" color="subdued" size="s">
              <p>
                Select an available data source and choose a query language to use for running
                queries. You can use the data dropdown or use the enhanced data selector to select
                data.
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton fill onClick={onOpenDataSelector}>
              Open data selector
            </EuiButton>
          </EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiFlexItem>
            <EuiText textAlign="center" size="xs">
              <p>Learn more about query languages</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup justifyContent="center" gutterSize="s" wrap>
              <EuiFlexItem grow={false}>
                <EuiLink href="#" target="_blank">
                  PPL documentation
                </EuiLink>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiLink href="#" target="_blank">
                  SQL documentation
                </EuiLink>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiLink href="#" target="_blank">
                  Lucene documentation
                </EuiLink>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiLink href="#" target="_blank">
                  DQL documentation
                </EuiLink>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  </EuiFlexGroup>
);
