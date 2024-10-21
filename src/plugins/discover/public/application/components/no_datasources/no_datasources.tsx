/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './no_datasources.scss';
import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiIcon,
  EuiSpacer,
  EuiButtonEmpty,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../../../../data/public';

export const DiscoverNoDatasources: React.FC = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const { application, docLinks } = opensearchDashboards.services;
  const ingestDataDocs = docLinks?.links.gettingStarted.ingestData;
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      gutterSize="none"
      className="discoverNoDatasources-centerPanel"
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
                  {i18n.translate('discover.noDatasources.addDataTitle', {
                    defaultMessage: 'Add data',
                  })}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText textAlign="center" color="subdued" size="xs">
                <p>
                  {i18n.translate('discover.noDatasources.addDataDescription', {
                    defaultMessage:
                      'To start exploring and visualizing your data, you need to add data sources to OpenSearch Dashboards.',
                  })}
                </p>
              </EuiText>
            </EuiFlexItem>
            <EuiSpacer size="s" />
            <EuiFlexGroup direction="row" gutterSize="s" alignItems="center">
              <EuiFlexItem>
                <EuiButtonEmpty
                  onClick={() => application?.navigateToApp('', { path: '/import_sample_data' })}
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('discover.noDatasources.addSampledata', {
                      defaultMessage: 'Add sample data',
                    })}
                  </EuiText>
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  href={ingestDataDocs}
                  target="_blank"
                  size="xs"
                  iconType="popout"
                  iconSide="right"
                  iconGap="s"
                >
                  <EuiText size="xs">
                    {i18n.translate('discover.noDatasources.dataIngestionDocument', {
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
};
