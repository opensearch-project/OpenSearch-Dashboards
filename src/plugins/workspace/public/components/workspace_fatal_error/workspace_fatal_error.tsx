/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiCallOut,
} from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { formatUrlWithWorkspaceId } from '../../utils';

export function WorkspaceFatalError(props: { error?: string }) {
  const {
    services: { application, http },
  } = useOpenSearchDashboards();
  const goBackToHome = () => {
    window.location.href = formatUrlWithWorkspaceId(
      application?.getUrlForApp('home') || '',
      '',
      http?.basePath
    );
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
                  id="core.fatalErrors.somethingWentWrongTitle"
                  defaultMessage="Something went wrong"
                />
              </h2>
            }
            body={
              <p>
                <FormattedMessage
                  id="core.fatalErrors.tryGoBackToDefaultWorkspaceDescription"
                  defaultMessage="The workspace you want to go can not be found, try go back to home."
                />
              </p>
            }
            actions={[
              <EuiButton color="primary" fill onClick={goBackToHome} data-test-subj="asd">
                <FormattedMessage
                  id="core.fatalErrors.goBackToHome"
                  defaultMessage="Go back to home"
                />
              </EuiButton>,
            ]}
          />
          {props.error ? <EuiCallOut title={props.error} color="danger" iconType="alert" /> : null}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}
