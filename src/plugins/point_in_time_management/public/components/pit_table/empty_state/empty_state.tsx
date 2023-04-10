/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

export const EmptyState = () => (
  <EuiEmptyPrompt
    body={
      <p>
        <FormattedMessage
          id="pointInTimeManagement.pointInTimeDescription"
          defaultMessage="No PIT objects have been created."
        />
      </p>
    }
    actions={
      <EuiButton iconType="plusInCircle" data-test-subj="createPITBtnInHeader">
        <FormattedMessage
          id="pointInTimeManagement.header.createPointInTimeButton"
          defaultMessage="Create PIT"
        />
      </EuiButton>
    }
  />
);
