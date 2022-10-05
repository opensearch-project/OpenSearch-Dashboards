/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import {
  EXPERIMENTAL_FEATURE,
  EXPERIMENTAL_FEATURE_CALL_OUT_DESCRIPTION,
  DATA_SOURCE_LEAVE_FEEDBACK_TEXT,
  DATA_SOURCE_DOCUMENTATION_TEXT,
  DATA_SOURCE_OPEN_FORUM_TEXT,
} from '../../../components/text_content';

export const ExperimentalCallOut = () => {
  return (
    <>
      <EuiCallOut title={EXPERIMENTAL_FEATURE} iconType="iInCircle">
        <p>
          {EXPERIMENTAL_FEATURE_CALL_OUT_DESCRIPTION}
          <EuiLink href="https://opensearch.org/docs/latest" target="_blank">
            {DATA_SOURCE_DOCUMENTATION_TEXT}
          </EuiLink>{' '}
          {DATA_SOURCE_LEAVE_FEEDBACK_TEXT}
          <EuiLink href="https://forum.opensearch.org" target="_blank">
            {DATA_SOURCE_OPEN_FORUM_TEXT}
          </EuiLink>
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};
