/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiDataGridColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { TimelineHeader } from './timeline_waterfall_bar';
import { TraceTimeRange } from '../../utils/span_timerange_utils';

export const getSpanListTableColumns = (): EuiDataGridColumn[] => {
  return [
    {
      id: 'serviceName',
      display: i18n.translate('explore.spanDetailTable.column.service', {
        defaultMessage: 'Service',
      }),
    },
    {
      id: 'name',
      display: i18n.translate('explore.spanDetailTable.column.operation', {
        defaultMessage: 'Operation',
      }),
    },
    {
      id: 'spanId',
      display: i18n.translate('explore.spanDetailTable.column.spanId', {
        defaultMessage: 'Span Id',
      }),
    },
    {
      id: 'parentSpanId',
      display: i18n.translate('explore.spanDetailTable.column.parentSpanId', {
        defaultMessage: 'Parent span Id',
      }),
    },
    {
      id: 'traceId',
      display: i18n.translate('explore.spanDetailTable.column.traceId', {
        defaultMessage: 'Trace Id',
      }),
    },
    {
      id: 'traceGroup',
      display: i18n.translate('explore.spanDetailTable.column.traceGroup', {
        defaultMessage: 'Trace group',
      }),
    },
    {
      id: 'status.code',
      display: i18n.translate('explore.spanDetailTable.column.errors', {
        defaultMessage: 'Errors',
      }),
      initialWidth: 80,
    },
    {
      id: 'durationInNanos',
      display: i18n.translate('explore.spanDetailTable.column.duration', {
        defaultMessage: 'Duration',
      }),
      initialWidth: 100,
    },
    {
      id: 'startTime',
      display: i18n.translate('explore.spanDetailTable.column.startTime', {
        defaultMessage: 'Start time',
      }),
    },
    {
      id: 'endTime',
      display: i18n.translate('explore.spanDetailTable.column.endTime', {
        defaultMessage: 'End time',
      }),
    },
  ];
};

export const getSpanHierarchyTableColumns = (
  traceTimeRange: TraceTimeRange,
  availableWidth?: number
): EuiDataGridColumn[] => {
  return [
    {
      id: 'span',
      display: i18n.translate('explore.spanDetailTable.column.span', {
        defaultMessage: 'Span',
      }),
      isExpandable: false,
      isResizable: true,
      actions: false,
    },
    {
      id: 'timeline',
      display: React.createElement(TimelineHeader, { traceTimeRange }),
      initialWidth: availableWidth ? Math.floor(availableWidth / 2) : 600,
      isExpandable: false,
      isResizable: true,
      actions: false,
    },
    {
      id: 'durationInNanos',
      display: i18n.translate('explore.spanDetailTable.column.duration', {
        defaultMessage: 'Duration',
      }),
      initialWidth: 100,
      isExpandable: false,
      actions: false,
    },
  ];
};
