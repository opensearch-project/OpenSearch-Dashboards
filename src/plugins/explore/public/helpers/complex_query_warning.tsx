/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiCallOut } from '@elastic/eui';

/**
 * Warning banner shown at the top of a save window (the top-nav Save modal, the Add-to-dashboard
 * modal, and the in-context Save-as-visualization modal) when the query being saved has been
 * flagged as complex by query profiling.
 *
 * It warns that a saved query re-runs on every dashboard load and refresh, so a complex query can
 * place sustained load on the cluster. The surrounding Save / Add action is unchanged — this is an
 * inline advisory, not a blocking confirmation.
 */
export const ComplexQueryWarningCallout = () => (
  <EuiCallOut
    title={i18n.translate('explore.queryProfiling.warnTitle', {
      defaultMessage: 'Complex query',
    })}
    color="warning"
    iconType="alert"
    size="s"
    data-test-subj="complexQueryWarningCallout"
  >
    {i18n.translate('explore.queryProfiling.warnMessage', {
      defaultMessage:
        'This query is resource-intensive and re-runs every time the dashboard loads or refreshes.',
    })}
  </EuiCallOut>
);
