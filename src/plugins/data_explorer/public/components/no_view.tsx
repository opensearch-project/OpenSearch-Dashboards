/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageTemplate, EuiEmptyPrompt } from '@elastic/eui';

export const NoView = () => {
  return (
    <EuiPageTemplate
      template="centeredContent"
      className="dePageTemplate"
      pageContentProps={{
        role: 'alertdialog',
        color: 'plain',
        hasBorder: false,
      }}
    >
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={<h2>View not found</h2>}
        body={
          <p>
            The view you are trying to access does not exist. Please check the URL and try again.
          </p>
        }
      />
    </EuiPageTemplate>
  );
};
