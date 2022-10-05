/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import { DocLinksStart } from 'opensearch-dashboards/public';
import {
  EXPERIMENTAL_FEATURE,
  EXPERIMENTAL_FEATURE_CALL_OUT_DESCRIPTION,
  DATA_SOURCE_LEAVE_FEEDBACK_TEXT,
  DATA_SOURCE_DOCUMENTATION_TEXT,
  DATA_SOURCE_OPEN_FORUM_TEXT,
} from '../../../components/text_content';

export const ExperimentalCallOut = ({ docLinks }: { docLinks: DocLinksStart }) => {
  return (
    <>
      <EuiCallOut title={EXPERIMENTAL_FEATURE} iconType="iInCircle">
        <p>
          {EXPERIMENTAL_FEATURE_CALL_OUT_DESCRIPTION}
          <EuiLink href={docLinks.links.noDocumentation.indexPatterns.introduction} target="_blank">
            {DATA_SOURCE_DOCUMENTATION_TEXT}
          </EuiLink>{' '}
          {DATA_SOURCE_LEAVE_FEEDBACK_TEXT}
          <EuiLink href={docLinks.links.noDocumentation.openSearchForum} target="_blank">
            {DATA_SOURCE_OPEN_FORUM_TEXT}
          </EuiLink>
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </>
  );
};
