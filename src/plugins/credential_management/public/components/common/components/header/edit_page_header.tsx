/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiBetaBadge, EuiSpacer, EuiTitle, EuiText, EuiCode, EuiLink } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { CredentialManagementContext } from '../../../../types';

export const EditPageHeader = ({
  isBeta = false,
  credentialName,
}: {
  isBeta?: boolean;
  credentialName: string;
}) => {
  const changeTitle = useOpenSearchDashboards<CredentialManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(credentialName);

  return (
    <div>
      <EuiTitle>
        <h1>
          {credentialName}
          {isBeta ? (
            <>
              <EuiBetaBadge
                label={i18n.translate('credentialManagement.createCredential.betaLabel', {
                  defaultMessage: 'Beta',
                })}
              />
            </>
          ) : null}
        </h1>
      </EuiTitle>
      <EuiSpacer size="s" />
    </div>
  );
};
