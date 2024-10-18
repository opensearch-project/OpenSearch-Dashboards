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
  EuiSmallButton,
  EuiSpacer,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';

interface NoIndexPatternsPanelProps {
  onOpenDataSelector: () => void;
}

export const NoIndexPatternsPanel: React.FC<NoIndexPatternsPanelProps> = ({
  onOpenDataSelector,
}) => (
  <EuiFlexGroup justifyContent="center" alignItems="center" gutterSize="none">
    <EuiFlexItem grow={false} className="dataUI-centerPanel">
      <EuiPanel paddingSize="l">
        <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiIcon type="dataVisualizer" size="xl" color="subdued" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2>Select data</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText textAlign="center" color="subdued" size="xs">
              Select an available data source and choose a query language to use for running
              queries. You can use the data dropdown or use the enhanced data selector to select
              data.
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiSmallButton fill onClick={onOpenDataSelector}>
              Open data selector
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiFlexItem>
            <EuiTitle size="xs">
              <h4>Learn more about query languages</h4>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup justifyContent="center" gutterSize="s" wrap>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="#"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">PPL documentation</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="#"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">SQL documentation</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="#"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">Lucene documentation</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href="#"
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">DQL documentation</EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  </EuiFlexGroup>
);
