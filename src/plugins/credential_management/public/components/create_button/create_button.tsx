/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
import { euiColorAccent } from '@elastic/eui/dist/eui_theme_light.json';
import React from 'react';
import * as H from 'history';

import { EuiButton } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface Props {
  history: H.History;
}

export const CreateButton = ({ history }: Props) => {
  return (
    <EuiButton
      data-test-subj="createCredentialButton"
      fill={true}
      onClick={() => history.push('/create')}
      iconType="plusInCircle"
    >
      <FormattedMessage
        id="credentialManagement.credentialsTable.createBtn"
        defaultMessage="Save your credential"
      />
    </EuiButton>
  );
};
