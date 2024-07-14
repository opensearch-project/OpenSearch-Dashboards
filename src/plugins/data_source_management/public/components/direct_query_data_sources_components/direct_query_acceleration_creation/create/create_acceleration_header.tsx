/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiLink,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { OPENSEARCH_ACC_DOCUMENTATION_URL } from '../../../../components/constants';

export const CreateAccelerationHeader = () => {
  return (
    <div>
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiTitle size="l" data-test-subj="acceleration-header">
            <h1>Accelerate data</h1>
          </EuiTitle>
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
