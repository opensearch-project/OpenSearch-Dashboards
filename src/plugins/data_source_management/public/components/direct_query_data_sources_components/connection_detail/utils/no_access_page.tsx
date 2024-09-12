/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiEmptyPrompt, EuiPage, EuiText } from '@elastic/eui';
import React from 'react';

export const NoAccess = () => {
  return (
    <EuiPage>
      <EuiEmptyPrompt
        iconType="alert"
        title={<h2>{'No permissions to access'}</h2>}
        body={
          <EuiText size="s">
            {
              'You are missing permissions to view connection details. Contact your administrator for permissions.'
            }
          </EuiText>
        }
        actions={
          <EuiButton color="primary" fill onClick={() => (window.location.hash = '')}>
            Return to data connections
          </EuiButton>
        }
      />
    </EuiPage>
  );
};
