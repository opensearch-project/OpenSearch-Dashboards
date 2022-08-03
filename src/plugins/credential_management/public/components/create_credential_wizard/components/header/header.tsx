/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiBetaBadge, EuiSpacer, EuiTitle, EuiText, EuiCode, EuiLink } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { CredentialManagementContext } from '../../../../types';
export const Header = ({ docLinks }: { docLinks: DocLinksStart }) => {
  const changeTitle = useOpenSearchDashboards<CredentialManagementContext>().services.chrome
    .docTitle.change;
  const createCredentialHeader = i18n.translate('credentialManagement.createIndexPatternHeader', {
    defaultMessage: 'Save Your Credential',
  });

  changeTitle(createCredentialHeader);

  return (
    <div>
      <EuiTitle>
        <h1>
          {createCredentialHeader}
          <>
            {' '}
            <EuiBetaBadge
              label={i18n.translate('credentialManagement.createCredential.betaLabel', {
                defaultMessage: 'Beta',
              })}
            />
          </>
        </h1>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText>
        <p>
          <FormattedMessage
            id="credentialManagement.createCredential.description"
            defaultMessage="A credential can be attached to multiple sources. For example, {credential} can be attached to two data sources {first} and {second}."
            values={{
              credential: <EuiCode>username-password-credential</EuiCode>,
              first: <EuiCode>os-service-log</EuiCode>,
              second: <EuiCode>os-application-log</EuiCode>,
            }}
          />
          <br />
          <EuiLink
            href={docLinks.links.noDocumentation.indexPatterns.introduction}
            target="_blank"
            external
          >
            <FormattedMessage
              id="credentialManagement.createCredential.documentation"
              defaultMessage="Read documentation"
            />
          </EuiLink>
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
