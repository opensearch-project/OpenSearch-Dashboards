/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCodeBlock } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { stringify } from '@osd/std';
import { useMemo } from 'react';
import { DocViewRenderProps } from '../../../types/doc_views_types';

const MAX_HIGHLIGHTED_JSON_LENGTH = 50000;

export function JsonCodeBlock({ hit }: DocViewRenderProps) {
  const json = useMemo(() => stringify(hit, null, 2), [hit]);
  // Highlighting creates a DOM node for each token. Keep large documents as plain text,
  // preserving the complete document for viewing and copying.
  const isLargeDocument = json.length > MAX_HIGHLIGHTED_JSON_LENGTH;
  const label = i18n.translate('explore.docViews.json.codeEditorAriaLabel', {
    defaultMessage: 'Read only JSON view of an opensearch document',
  });
  return (
    <EuiCodeBlock
      aria-label={label}
      language={isLargeDocument ? undefined : 'json'}
      isCopyable
      paddingSize="s"
      fontSize="s"
      overflowHeight={isLargeDocument ? 400 : undefined}
      data-test-subj="osdJsonCodeBlock"
    >
      {json}
    </EuiCodeBlock>
  );
}
