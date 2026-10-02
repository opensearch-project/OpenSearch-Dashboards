/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

/**
 * Shown in place of a credential form when the JWT auth type is selected. There is
 * nothing for the user to enter, so this explains what will happen instead and calls out
 * the two things that most commonly trip operators up: the data source cluster has to
 * trust the same token issuer, and Test Connection only proves the current user's access.
 */
export const JwtAuthDescription = () => (
  <>
    <EuiSpacer size="m" />
    <EuiText size="s">
      <FormattedMessage
        id="dataSourcesManagement.jwtAuth.description"
        defaultMessage="Each request to this data source forwards the signed-in user's own credentials, so the data source evaluates that user's permissions. No credentials are stored."
      />
    </EuiText>
    <EuiSpacer size="s" />
    <EuiCallOut
      size="s"
      iconType="iInCircle"
      title={i18n.translate('dataSourcesManagement.jwtAuth.requirementsTitle', {
        defaultMessage: 'Before you connect',
      })}
    >
      <EuiText size="s">
        <ul>
          <li>
            <FormattedMessage
              id="dataSourcesManagement.jwtAuth.trustRequirement"
              defaultMessage="The data source cluster must accept the same tokens as this dashboard, and must define the roles for each user, since it evaluates permissions itself."
            />
          </li>
          <li>
            <FormattedMessage
              id="dataSourcesManagement.jwtAuth.testConnectionCaveat"
              defaultMessage="Test connection uses your own credentials. It confirms the connection works for you, not that it will work for other users."
            />
          </li>
        </ul>
      </EuiText>
    </EuiCallOut>
  </>
);
