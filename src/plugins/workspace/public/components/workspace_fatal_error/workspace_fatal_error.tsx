/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSmallButton,
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiCallOut,
} from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { HttpSetup } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

export function WorkspaceFatalError(props: { error?: string }) {
  const {
    services: { http },
  } = useOpenSearchDashboards();
  const goBackToHome = () => {
    window.location.href = (http as HttpSetup).basePath.prepend('/', {
      withoutClientBasePath: true,
    });
  };
  return (
    <EuiPage style={{ minHeight: '100vh' }}>
      <EuiPageBody component="main">
        <EuiPageContent verticalPosition="center" horizontalPosition="center">
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            title={
              <h2>
                <FormattedMessage
                  id="workspace.fatalErrors.somethingWentWrongTitle"
                  defaultMessage="Something went wrong"
                />
              </h2>
            }
            body={
              <p>
                <FormattedMessage
                  id="workspace.fatalErrors.tryGoBackToDefaultWorkspaceDescription"
                  defaultMessage="The workspace you are trying to access cannot be found. Please return to the homepage and try again."
                />
              </p>
            }
            actions={[
              <EuiSmallButton color="primary" fill onClick={goBackToHome}>
                <FormattedMessage
                  id="workspace.fatalErrors.goBackToHome"
                  defaultMessage="Go back to homepage"
                />
              </EuiSmallButton>,
            ]}
          />
          {props.error ? <EuiCallOut title={props.error} color="danger" iconType="alert" /> : null}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}
