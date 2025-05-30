/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIconTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export function DocViewTableRowIconNoMapping() {
  const ariaLabel = i18n.translate('explore.docViews.table.noCachedMappingForThisFieldAriaLabel', {
    defaultMessage: 'Warning',
  });
  const tooltipContent = i18n.translate(
    'explore.docViews.table.noCachedMappingForThisFieldTooltip',
    {
      defaultMessage:
        'No cached mapping for this field. Refresh field list from the Management > Index Patterns page',
    }
  );
  return (
    <EuiIconTip
      aria-label={ariaLabel}
      color="warning"
      content={tooltipContent}
      iconProps={{
        className: 'exploreDocViewer__warning',
        'data-test-subj': 'noMappingWarning',
      }}
      size="s"
      type="alert"
    />
  );
}
