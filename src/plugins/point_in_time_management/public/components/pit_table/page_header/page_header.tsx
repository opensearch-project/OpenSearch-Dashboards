/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

export const PageHeader = () => (
  <>
    <EuiPageContentHeader>
      <EuiPageContentHeaderSection>
        <EuiTitle>
          <h1>
            <FormattedMessage id="pitManagement.header.pitTitle" defaultMessage="Point in Time" />
          </h1>
        </EuiTitle>
      </EuiPageContentHeaderSection>
      <EuiButton fill={true} iconType="plusInCircle" data-test-subj="createPITBtnInHeader">
        <FormattedMessage id="pitManagement.header.createPitButton" defaultMessage="Create PIT" />
      </EuiButton>
    </EuiPageContentHeader>
    <EuiText size="s">
      <p>
        <FormattedMessage
          id="pitManagement.pitDescription"
          defaultMessage="Create and manage point in time objects."
        />
      </p>
    </EuiText>
  </>
);
