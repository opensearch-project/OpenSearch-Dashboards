/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';
import { TRACE_LOGS_LIMIT, TraceLogs } from './use_trace_logs';

/** Fetch errors and the per-dataset limit, above the correlated logs. */
export const TraceLogsNotices: React.FC<{ traceLogs: TraceLogs }> = ({ traceLogs }) => {
  if (traceLogs.isLoading) return null;
  const { errors, cappedDatasetIds } = traceLogs;
  if (errors.length === 0 && cappedDatasetIds.length === 0) return null;
  return (
    <>
      {errors.length > 0 && (
        <EuiCallOut
          size="s"
          color="danger"
          iconType="alert"
          data-test-subj="agentTracesLogsError"
          title={i18n.translate('agentTraces.flyout.logsError', {
            defaultMessage: 'Some correlated logs could not be loaded',
          })}
        >
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </EuiCallOut>
      )}
      {cappedDatasetIds.length > 0 && (
        <EuiCallOut
          size="s"
          iconType="iInCircle"
          data-test-subj="agentTracesLogsCapped"
          title={i18n.translate('agentTraces.flyout.logsCapped', {
            defaultMessage:
              'Showing the {limit} most recent logs per dataset. Use "View in Discover Logs" to see all of them.',
            values: { limit: TRACE_LOGS_LIMIT },
          })}
        />
      )}
      <EuiSpacer size="s" />
    </>
  );
};
