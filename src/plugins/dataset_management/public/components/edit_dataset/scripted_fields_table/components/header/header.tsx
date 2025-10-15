/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { EuiSmallButton, EuiFlexGroup, EuiFlexItem, EuiText, EuiTitle } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { ScopedHistory } from 'opensearch-dashboards/public';

import { reactRouterNavigate } from '../../../../../../../opensearch_dashboards_react/public';

interface HeaderProps extends RouteComponentProps {
  datasetId: string;
  history: ScopedHistory;
  useUpdatedUX: boolean;
}

export const Header = withRouter(({ datasetId, history, useUpdatedUX }: HeaderProps) => (
  <EuiFlexGroup alignItems="center">
    <EuiFlexItem>
      <EuiTitle size="s">
        <h3>
          <FormattedMessage
            id="datasetManagement.editDataset.scriptedHeader"
            defaultMessage="Scripted fields"
          />
        </h3>
      </EuiTitle>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="datasetManagement.editDataset.scriptedLabel"
            defaultMessage="You can use scripted fields in visualizations and display them in your documents. However, you cannot search
            scripted fields."
          />
        </p>
      </EuiText>
    </EuiFlexItem>

    <EuiFlexItem grow={false}>
      <EuiSmallButton
        {...(useUpdatedUX ? { iconType: 'plusInCircle' } : {})}
        data-test-subj="addScriptedFieldLink"
        {...reactRouterNavigate(history, `patterns/${datasetId}/create-field/`)}
      >
        <FormattedMessage
          id="datasetManagement.editDataset.scripted.addFieldButton"
          defaultMessage="Add scripted field"
        />
      </EuiSmallButton>
    </EuiFlexItem>
  </EuiFlexGroup>
));
