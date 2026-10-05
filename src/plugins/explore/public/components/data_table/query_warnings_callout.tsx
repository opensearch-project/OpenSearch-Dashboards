/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiLink, EuiSpacer, EuiText } from '@elastic/eui';
import { QueryWarning } from '../../application/utils/state_management/slices';

interface QueryWarningsCalloutProps {
  warnings: QueryWarning[];
}

/** Machine-readable warning type set by the backend (see Warning.TYPE_PARTIAL_RESULT). */
const PARTIAL_RESULT_TYPE = 'PARTIAL_RESULT';

const partialResultTitle = i18n.translate('explore.queryWarnings.partialResultTitle', {
  defaultMessage: 'Partial results',
});

const defaultTitle = i18n.translate('explore.queryWarnings.defaultTitle', {
  defaultMessage: 'Warning',
});

const showMoreLabel = i18n.translate('explore.queryWarnings.showMore', {
  defaultMessage: 'Show more',
});

const showLessLabel = i18n.translate('explore.queryWarnings.showLess', {
  defaultMessage: 'Show less',
});

/** A short, explicit heading for the callout, chosen from the warning's machine-readable type. */
const titleForType = (type: string): string =>
  type === PARTIAL_RESULT_TYPE ? partialResultTitle : defaultTitle;

/**
 * A single warning callout: the {@link QueryWarning.message} is always visible, with the longer
 * {@link QueryWarning.detail} behind a "Show more" toggle so the banner stays compact. Uses the
 * {@code partial} glyph rather than {@code alert}, which reads as a Danger callout.
 */
const WarningCallout: React.FC<{ warning: QueryWarning }> = ({ warning }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <EuiCallOut
      title={titleForType(warning.type)}
      color="warning"
      iconType="partial"
      size="s"
      data-test-subj="queryWarningsCallout"
    >
      {warning.message || warning.detail ? (
        <EuiText size="s">
          {warning.message}
          {warning.detail ? (
            <>
              {expanded ? ` ${warning.detail}` : ' '}
              <EuiLink
                onClick={() => setExpanded((prev) => !prev)}
                data-test-subj="queryWarningsToggle"
                aria-expanded={expanded}
              >
                {expanded ? showLessLabel : showMoreLabel}
              </EuiLink>
            </>
          ) : null}
        </EuiText>
      ) : null}
    </EuiCallOut>
  );
};

/**
 * Banner shown above the results grid when the backend attached non-fatal warnings to an
 * otherwise-successful result, so an incomplete answer is never mistaken for a complete one.
 */
export const QueryWarningsCallout: React.FC<QueryWarningsCalloutProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <>
      {warnings.map((warning, index) => (
        <React.Fragment key={index}>
          <WarningCallout warning={warning} />
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}
    </>
  );
};
