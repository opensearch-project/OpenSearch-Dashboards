/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo } from 'react';
import { EuiLink } from '@elastic/eui';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { useDatasetContext } from '../../../../application/context';
import { SPAN_ID_FIELD_PATHS, TRACE_ID_FIELD_PATHS } from '../../../../utils/trace_field_constants';
import {
  buildTraceDetailsUrl,
  extractFieldFromRowData,
} from '../../table_cell/trace_utils/trace_utils';

export interface SpanLinkProps {
  rowData: OpenSearchSearchHit<Record<string, unknown>>;
}

export const SpanLink = ({ rowData }: SpanLinkProps) => {
  const { dataset } = useDatasetContext();

  const fullPageUrl = useMemo(() => {
    if (dataset == null) {
      return null;
    }

    // Extract spanId from row data
    const spanIdValue = extractFieldFromRowData(rowData, SPAN_ID_FIELD_PATHS);

    // Extract traceId from row data
    const traceIdValue = extractFieldFromRowData(rowData, TRACE_ID_FIELD_PATHS);

    // Check if both values exist before building URL
    if (!spanIdValue || !traceIdValue) {
      return null;
    }

    return buildTraceDetailsUrl(spanIdValue, traceIdValue, dataset);
  }, [dataset, rowData]);

  if (!fullPageUrl) {
    return null;
  }

  return (
    <EuiLink
      href={fullPageUrl}
      target="_blank"
      style={{ fontWeight: 'normal' }}
      data-test-subj={'osdDocTableDetailsSpanLink'}
    >
      {i18n.translate('explore.dataTable.spanLink.viewDetails', {
        defaultMessage: 'view details',
      })}
    </EuiLink>
  );
};
