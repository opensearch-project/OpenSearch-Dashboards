/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiLink, EuiPageHeader, EuiPageHeaderSection, EuiSpacer, EuiText } from '@elastic/eui';
import React from 'react';
import { OPENSEARCH_ACC_DOCUMENTATION_URL } from '../../../constants';

export const CreateAccelerationHeader = () => {
  return (
    <div>
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiText size="s" data-test-subj="acceleration-header">
            <h1>Accelerate data</h1>
          </EuiText>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        Create OpenSearch Indexes from external data connections for better performance.{' '}
        <EuiLink external={true} href={OPENSEARCH_ACC_DOCUMENTATION_URL} target="_blank">
          Learn more
        </EuiLink>
      </EuiText>
    </div>
  );
};
