/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiCallOut, EuiLink, EuiSpacer, EuiText } from '@elastic/eui';
import { QueryWarning } from '../../application/utils/state_management/slices';

interface QueryWarningsCalloutProps {
  warnings: QueryWarning[];
  /**
   * Rerun the query with partial results turned off, so an inconsistently-mapped aggregation
   * returns the complete (slower) result over all indices instead of a partial subset. Omit to
   * hide the action (e.g. where a rerun is not available).
   */
  onRerunWithoutPartialResults?: () => void;
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

const rerunWithoutPartialLabel = i18n.translate('explore.queryWarnings.rerunWithoutPartial', {
  defaultMessage: 'Rerun without partial results',
});

/** A short, explicit heading for the callout, chosen from the warning's machine-readable type. */
const titleForType = (type: string): string =>
  type === PARTIAL_RESULT_TYPE ? partialResultTitle : defaultTitle;

/**
 * A single warning callout. The title is an explicit label for the warning type (e.g. "Partial
 * results"); the short {@link QueryWarning.message} is the always-visible summary, followed inline
 * by a "Show more" toggle for the longer {@link QueryWarning.detail} (which can name many indices),
 * so the callout stays compact. Uses the {@code partial} glyph rather than the {@code alert} icon
 * (which reads as a Danger callout) and an outlined button for the action so the CTA is legible.
 */
const WarningCallout: React.FC<{
  warning: QueryWarning;
  onRerunWithoutPartialResults?: () => void;
}> = ({ warning, onRerunWithoutPartialResults }) => {
  const [expanded, setExpanded] = useState(false);
  // The rerun only makes sense for a partial result -- it is what turns the subset back into the
  // complete (slower) answer over all indices.
  const showRerun = warning.type === PARTIAL_RESULT_TYPE && !!onRerunWithoutPartialResults;

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
      {showRerun ? (
        <>
          <EuiSpacer size="xs" />
          <EuiButton
            size="s"
            iconType="refresh"
            color="warning"
            onClick={onRerunWithoutPartialResults}
            data-test-subj="queryWarningsRerunWithoutPartial"
          >
            {rerunWithoutPartialLabel}
          </EuiButton>
        </>
      ) : null}
    </EuiCallOut>
  );
};

/**
 * Banner shown above the results grid when the backend attached non-fatal warnings to an
 * otherwise-successful result — most notably a partial result returned over a subset of indices.
 * It is rendered on every result view (not only save windows) so a partial, and therefore
 * potentially undercounted, result is never mistaken for a complete one.
 */
export const QueryWarningsCallout: React.FC<QueryWarningsCalloutProps> = ({
  warnings,
  onRerunWithoutPartialResults,
}) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <>
      {warnings.map((warning, index) => (
        <React.Fragment key={index}>
          <WarningCallout
            warning={warning}
            onRerunWithoutPartialResults={onRerunWithoutPartialResults}
          />
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}
    </>
  );
};
