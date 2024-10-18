/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiIcon,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface NoDataSourcesPanelProps {
  onOpenDataSelector: () => void;
  navigateToApp: (app: string, options?: { path: string }) => void;
}

export const NoDataSourcesPanel: React.FC<NoDataSourcesPanelProps> = ({
  onOpenDataSelector,
  navigateToApp,
}) => (
  <EuiFlexGroup
    justifyContent="center"
    alignItems="center"
    gutterSize="none"
    className="dataUI-centerPanel"
  >
    <EuiFlexItem grow={false}>
      <EuiPanel paddingSize="l">
        <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiIcon type="visBarVertical" size="xl" color="subdued" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2>
                {i18n.translate('data.noDataSources.addDataTitle', {
                  defaultMessage: 'Add data',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText textAlign="center" color="subdued" size="xs">
              <p>
                {i18n.translate('data.noDataSources.addDataDescription', {
                  defaultMessage:
                    'To start exploring and visualizing your data, you need to add data sources to OpenSearch Dashboards.',
                })}
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton fill onClick={onOpenDataSelector}>
              {i18n.translate('data.noDataSources.addDataButton', {
                defaultMessage: 'Add data',
              })}
            </EuiButton>
          </EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiFlexGroup direction="row" gutterSize="s" alignItems="center">
            <EuiFlexItem>
              <EuiButtonEmpty
                onClick={() => navigateToApp('home', { path: '#/tutorial_directory/sampleData' })}
                size="xs"
                iconType="popout"
                iconSide="right"
                iconGap="s"
              >
                <EuiText size="xs">
                  {i18n.translate('data.noDatasources.addSampledata', {
                    defaultMessage: 'Add sample data',
                  })}
                </EuiText>
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                href="https://opensearch.org/docs/latest/query-dsl/full-text/query-string/"
                target="_blank"
                size="xs"
                iconType="popout"
                iconSide="right"
                iconGap="s"
              >
                <EuiText size="xs">
                  {i18n.translate('data.noDatasources.dataIngestionDocument', {
                    defaultMessage: 'Data ingestion document',
                  })}
                </EuiText>
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  </EuiFlexGroup>
);
