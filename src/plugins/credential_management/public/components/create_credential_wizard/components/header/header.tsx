/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiSpacer, EuiTitle, EuiText } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { CredentialManagementContext } from '../../../../types';

export const Header = ({ docLinks }: { docLinks: DocLinksStart }) => {
  const changeTitle = useOpenSearchDashboards<CredentialManagementContext>().services.chrome
    .docTitle.change;
  const createCredentialHeader = i18n.translate('credentialManagement.createIndexPatternHeader', {
    defaultMessage: 'Create Stored Credential',
  });

  changeTitle(createCredentialHeader);

  return (
    <div>
      <EuiTitle>
        <h1>{createCredentialHeader}</h1>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText>
        <p>
          <FormattedMessage
            id="credentialManagement.createCredential.description"
            defaultMessage="A credential can be attached to multiple sources."
          />
        </p>
      </EuiText>
      {prompt ? (
        <>
          <EuiSpacer size="m" />
          {prompt}
        </>
      ) : null}
    </div>
  );
};
