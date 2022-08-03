/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiTitle } from '@elastic/eui';
import React from 'react';
import { withRouter } from 'react-router-dom';

export const CreateDataSourceWizard = () => {
  return (
    <EuiTitle>
      <h2>{'This is the data source creation page'}</h2>
    </EuiTitle>
  );
};

export const CreateDataSourceWizardWithRouter = withRouter(CreateDataSourceWizard);
