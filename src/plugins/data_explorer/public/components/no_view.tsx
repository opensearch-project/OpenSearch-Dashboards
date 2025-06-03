/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageTemplate, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export const NoView = () => {
  return (
    <EuiPageTemplate
      template="centeredContent"
      className="deLayout"
      pageContentProps={{
        role: 'alertdialog',
        color: 'plain',
        hasBorder: false,
      }}
    >
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={
          <h2>
            <FormattedMessage id="dataExplorer.noView.title" defaultMessage="View not found" />
          </h2>
        }
        body={
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dataExplorer.noView.body"
                defaultMessage="The view you are trying to access does not exist. Please check the URL and try again."
              />
            </p>
          </EuiText>
        }
      />
    </EuiPageTemplate>
  );
};
