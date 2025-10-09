/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiBadgeGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { useTraceFlyoutContext } from './trace_flyout_context';
import { TraceDetails } from '../trace_details/trace_view';
import {
  buildTraceDetailsUrl,
  extractFieldFromRowData,
} from '../../../../components/data_table/table_cell/trace_utils/trace_utils';
import {
  DURATION_FIELD_PATHS,
  HTTP_STATUS_CODE_FIELD_PATHS,
} from '../../../../utils/trace_field_constants';
import { getStatusCodeColor } from '../../../../components/data_table/table_cell/trace_utils/trace_utils';
import { nanoToMilliSec, round } from '../trace_details/public/utils/helper_functions';

export const TraceFlyout: React.FC = () => {
  const { closeTraceFlyout, flyoutData, isFlyoutOpen } = useTraceFlyoutContext();

  if (!flyoutData || !isFlyoutOpen) return null;

  const { spanId, traceId, dataset, rowData } = flyoutData || {};
  const traceDetailsUrl = buildTraceDetailsUrl(spanId, traceId, dataset);
  const duration = Number(extractFieldFromRowData(rowData, DURATION_FIELD_PATHS));
  const httpStatusCode = Number(extractFieldFromRowData(rowData, HTTP_STATUS_CODE_FIELD_PATHS));
  const durationLabel = `${round(nanoToMilliSec(duration), 2)} ms`;

  return (
    <EuiFlyout data-test-subj="traceFlyout" onClose={closeTraceFlyout} ownFocus={false}>
      <EuiFlyoutHeader>
        <EuiFlexGroup direction="row" gutterSize="s" alignItems="center" justifyContent="flexStart">
          <EuiFlexItem grow={false}>
            {traceId && (
              <EuiTitle>
                <h2>Trace: {traceId}</h2>
              </EuiTitle>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadgeGroup>
              {duration > 0 && (
                <EuiBadge data-test-subj="traceDuration" iconType="clock">
                  {durationLabel}
                </EuiBadge>
              )}
              {httpStatusCode > 0 && (
                <EuiBadge
                  data-test-subj="traceStatusCode"
                  color={getStatusCodeColor(httpStatusCode)}
                >
                  {httpStatusCode}
                </EuiBadge>
              )}
            </EuiBadgeGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiLink
              href={traceDetailsUrl}
              target="blank"
              external
              data-test-subj="traceDetailsLink"
            >
              {i18n.translate('explore.dataTableFlyout.openFullPage', {
                defaultMessage: 'Open full page',
              })}
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <TraceDetails isFlyout={true} />
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
