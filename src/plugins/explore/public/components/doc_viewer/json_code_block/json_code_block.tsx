/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCodeBlock } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { stringify } from '@osd/std';
import { DocViewRenderProps } from '../../../types/doc_views_types';

export function JsonCodeBlock({ hit }: DocViewRenderProps) {
  const label = i18n.translate('explore.docViews.json.codeEditorAriaLabel', {
    defaultMessage: 'Read only JSON view of an opensearch document',
  });
  return (
    <EuiCodeBlock
      aria-label={label}
      language="json"
      isCopyable
      paddingSize="s"
      fontSize="s"
      data-test-subj="osdJsonCodeBlock"
    >
      {stringify(hit, null, 2)}
    </EuiCodeBlock>
  );
}
