/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';
import { QueryWarning } from '../../application/utils/state_management/slices';

interface QueryWarningsCalloutProps {
  warnings: QueryWarning[];
}

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
          <EuiCallOut
            title={
              warning.message ||
              i18n.translate('explore.queryWarnings.defaultTitle', {
                defaultMessage: 'Partial result',
              })
            }
            color="warning"
            iconType="alert"
            size="s"
            data-test-subj="queryWarningsCallout"
          >
            {warning.detail ? <p>{warning.detail}</p> : null}
          </EuiCallOut>
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}
    </>
  );
};
