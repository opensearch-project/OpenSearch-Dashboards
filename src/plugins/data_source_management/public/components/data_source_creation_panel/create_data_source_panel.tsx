/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPageHeader, EuiPanel } from '@elastic/eui';
import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';

export const CreateDataSourcePanel: React.FC<RouteComponentProps> = (props) => {
  const { history } = props;

  useEffect(() => {
    // Add breadcrumb setup or any other setup logic here if needed
  }, [history]);

  return (
    <EuiPanel>
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiPageHeader>
            <CreateDataSourcePanelHeader />
          </EuiPageHeader>
        </EuiFlexItem>
        <EuiFlexItem>
          <CreateDataSourceCardView history={history} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
