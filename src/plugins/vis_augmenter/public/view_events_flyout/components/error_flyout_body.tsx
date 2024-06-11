/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlyoutBody, EuiFlexGroup, EuiFlexItem, EuiCallOut } from '@elastic/eui';

interface Props {
  errorMessage: string;
}

export function ErrorFlyoutBody(props: Props) {
  return (
    <EuiFlyoutBody>
      <EuiFlexGroup>
        <EuiFlexItem grow={true}>
          <EuiCallOut color="danger" iconType="alert" data-test-subj="errorCallOut">
            {props.errorMessage}
          </EuiCallOut>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutBody>
  );
}
