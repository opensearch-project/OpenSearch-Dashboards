/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
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
 * A single warning callout. The title is an explicit label for the warning type (e.g. "Partial
 * results"); the short {@link QueryWarning.message} is the always-visible summary; the longer
 * {@link QueryWarning.detail} (which can name many indices) is collapsed behind a "Show more"
 * toggle so the banner stays compact.
 */
const WarningCallout: React.FC<{ warning: QueryWarning }> = ({ warning }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <EuiCallOut
      title={titleForType(warning.type)}
      color="warning"
      iconType="alert"
      size="s"
      data-test-subj="queryWarningsCallout"
    >
      {warning.message ? <p>{warning.message}</p> : null}
      {warning.detail ? (
        <>
          {expanded ? <p>{warning.detail}</p> : null}
          <EuiLink
            onClick={() => setExpanded((prev) => !prev)}
            data-test-subj="queryWarningsToggle"
            aria-expanded={expanded}
          >
            {expanded ? showLessLabel : showMoreLabel}
          </EuiLink>
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
