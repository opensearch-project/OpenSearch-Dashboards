/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { useEffect } from 'react';
import './span_detail_table.scss';
import { formatSpanDuration } from '../../utils/helper_functions';
import { extractSpanDuration } from '../../utils/span_data_utils';
import { TRACE_ANALYTICS_DATE_FORMAT } from '../../utils/shared_const';
import { resolveServiceNameFromSpan } from '../ppl_resolve_helpers';
import { TimelineWaterfallBar } from './timeline_waterfall_bar';
import { TraceTimeRange } from '../../utils/span_timerange_utils';
import { ParsedHit, Span, SpanTableProps } from './types';

export const SpanCell = ({
  rowIndex,
  columnId,
  items,
  tableParams,
  disableInteractions,
  props,
  setCellProps,
  traceTimeRange,
  colorMap,
  visibleRange,
}: {
  rowIndex: number;
  columnId: string;
  items: ParsedHit[];
  tableParams: { page: number; size: number };
  disableInteractions: boolean;
  props: SpanTableProps;
  setCellProps?: (props: any) => void;
  traceTimeRange?: TraceTimeRange;
  colorMap?: Record<string, string>;
  visibleRange?: TraceTimeRange;
}) => {
  const adjustedRowIndex = rowIndex - tableParams.page * tableParams.size;
  const item = items[adjustedRowIndex];

  useEffect(() => {
    if (
      item &&
      props.selectedSpanId &&
      props.selectedSpanId === item.spanId &&
      !disableInteractions
    ) {
      setCellProps?.({ className: 'exploreSpanDetailTable__selectedRow' });
    } else {
      setCellProps?.({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedSpanId, item?.spanId, disableInteractions]);

  const cellContent = renderSpanCellValue(
    { item, columnId },
    traceTimeRange,
    colorMap,
    props.selectedSpanId,
    visibleRange
  );

  return disableInteractions || !item ? (
    cellContent
  ) : (
    <button
      className="exploreSpanDetailTable__flyoutButton"
      onClick={() => props.openFlyout(item.spanId)}
    >
      {cellContent}
    </button>
  );
};

export const renderSpanCellValue = (
  { columnId, item }: { item: Span; columnId: string },
  traceTimeRange?: TraceTimeRange,
  colorMap?: Record<string, string>,
  selectedSpanId?: string,
  visibleRange?: TraceTimeRange
): any => {
  if (!item) return '-';

  const value = item[columnId];
  switch (columnId) {
    case 'status.code':
      return value === 2 ? (
        <EuiText color="danger" size="s">
          {i18n.translate('explore.spanDetailTable.errors.yes', {
            defaultMessage: 'Yes',
          })}
        </EuiText>
      ) : (
        i18n.translate('explore.spanDetailTable.errors.no', {
          defaultMessage: 'No',
        })
      );
    case 'spanId':
      return <span>{value}</span>;
    case 'durationInNanos':
      return formatSpanDuration(extractSpanDuration(item));
    case 'startTime':
      return moment(value).format(TRACE_ANALYTICS_DATE_FORMAT);
    case 'endTime':
      return moment(value).format(TRACE_ANALYTICS_DATE_FORMAT);
    case 'serviceName':
      return resolveServiceNameFromSpan(item) || value || '-';
    case 'timeline':
      return traceTimeRange ? (
        <TimelineWaterfallBar
          span={item}
          traceTimeRange={traceTimeRange}
          colorMap={colorMap}
          isSelected={!!selectedSpanId && item.spanId === selectedSpanId}
          visibleRange={visibleRange}
        />
      ) : null;
    default:
      return value || '-';
  }
};
