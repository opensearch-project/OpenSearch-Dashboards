/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';

import { EuiText, EuiCode, EuiLink } from '@elastic/eui';

interface Props {
  docLinks: DocLinksStart;
}

export const Description = ({ docLinks }: Props) => (
  <EuiText>
    <p>
      <FormattedMessage
        id="indexPatternManagement.createIndexPattern.description"
        defaultMessage="An index pattern can match a single source, for example, {single}, or {multiple} data sources, {star}."
        values={{
          multiple: <strong>multiple</strong>,
          single: <EuiCode>filebeat-4-3-22</EuiCode>,
          star: <EuiCode>filebeat-*</EuiCode>,
        }}
      />
      <br />
      <EuiLink
        href={docLinks.links.noDocumentation.indexPatterns.introduction}
        target="_blank"
        external
      >
        <FormattedMessage
          id="indexPatternManagement.createIndexPattern.documentation"
          defaultMessage="Read documentation"
        />
      </EuiLink>
    </p>
  </EuiText>
);
