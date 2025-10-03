/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiCodeBlock } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isEmpty } from '../../utils/helper_functions';
import './span_tabs.scss';

export interface SpanRawSpanTabProps {
  selectedSpan?: any;
}

export const SpanRawSpanTab: React.FC<SpanRawSpanTabProps> = ({ selectedSpan }) => {
  if (!selectedSpan || isEmpty(selectedSpan)) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanRawSpanTab.noSpanSelected', {
          defaultMessage: 'No span selected',
        })}
      </EuiText>
    );
  }

  return (
    <EuiCodeBlock
      language="json"
      paddingSize="s"
      isCopyable
      whiteSpace="pre-wrap"
      className="exploreSpanTabs__codeBlock"
    >
      {JSON.stringify(selectedSpan, null, 2)}
    </EuiCodeBlock>
  );
};
