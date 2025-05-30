/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIconTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export function DocViewTableRowIconUnderscore() {
  const ariaLabel = i18n.translate(
    'explore.docViews.table.fieldNamesBeginningWithUnderscoreUnsupportedAriaLabel',
    {
      defaultMessage: 'Warning',
    }
  );
  const tooltipContent = i18n.translate(
    'explore.docViews.table.fieldNamesBeginningWithUnderscoreUnsupportedTooltip',
    {
      defaultMessage: 'Field names beginning with {underscoreSign} are not supported',
      values: { underscoreSign: '_' },
    }
  );

  return (
    <EuiIconTip
      aria-label={ariaLabel}
      content={tooltipContent}
      color="warning"
      iconProps={{
        className: 'exploreDocViewer__warning',
        'data-test-subj': 'underscoreWarning',
      }}
      size="s"
      type="alert"
    />
  );
}
