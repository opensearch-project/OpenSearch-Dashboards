/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiHealth, EuiProgress } from '@elastic/eui';
import { TableHeaderColumn } from '../../../components/data_table/table_header/table_header_column';
import { getCategoryMeta, getSpanCategory } from '../../../services/span_categorization';
import { TraceRow } from '../traces/hooks/tree_utils';
import { previewSpanInput, previewSpanOutput } from '../traces/hooks/genai_message_preview';

const LAZY_LOAD_BATCH_SIZE = 50;

export const KindBadge: React.FC<{ row: TraceRow }> = ({ row }) => {
  const meta = getCategoryMeta(getSpanCategory(row));
  return (
    <EuiBadge
      className="agentTraces__categoryBadge"
      color={meta.bgColor}
      style={{ color: meta.textColor }}
    >
      {meta.label}
    </EuiBadge>
  );
};

const setTitleIfTruncated = (text: string) => (e: React.MouseEvent<HTMLSpanElement>) => {
  const el = e.currentTarget;
  el.title = el.scrollWidth > el.clientWidth ? text : '';
};

interface Column {
  key: 'status' | 'kind' | 'name' | 'input' | 'output' | 'latency';
  label: string;
  wideText?: boolean;
}

const COLUMNS: Column[] = [
  {
    key: 'status',
    label: i18n.translate('agentTraces.sessions.drill.status', { defaultMessage: 'Status' }),
  },
  {
    key: 'kind',
    label: i18n.translate('agentTraces.sessions.drill.kind', { defaultMessage: 'Kind' }),
  },
  {
    key: 'name',
    label: i18n.translate('agentTraces.sessions.drill.name', { defaultMessage: 'Name' }),
  },
  {
    key: 'input',
    label: i18n.translate('agentTraces.sessions.drill.input', { defaultMessage: 'Input' }),
    wideText: true,
  },
  {
    key: 'output',
    label: i18n.translate('agentTraces.sessions.drill.output', { defaultMessage: 'Output' }),
    wideText: true,
  },
  {
    key: 'latency',
    label: i18n.translate('agentTraces.sessions.drill.latency', { defaultMessage: 'Latency' }),
  },
];

interface SessionSpansTableProps {
  rows: TraceRow[];
  onRowClick: (row: TraceRow) => void;
}

/** Session-scoped traces/spans table, using the same markup and styles as the Traces tab. */
export const SessionSpansTable: React.FC<SessionSpansTableProps> = ({ rows, onRowClick }) => {
  const [renderedCount, setRenderedCount] = useState(LAZY_LOAD_BATCH_SIZE);
  useEffect(() => setRenderedCount(LAZY_LOAD_BATCH_SIZE), [rows]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (node && typeof IntersectionObserver !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setRenderedCount((c) => c + LAZY_LOAD_BATCH_SIZE);
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, []);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const renderCell = (row: TraceRow, key: Column['key']) => {
    switch (key) {
      case 'status':
        return (
          <EuiHealth color={row.status === 'success' ? 'success' : 'danger'} textSize="xs">
            {row.status === 'success'
              ? i18n.translate('agentTraces.dataTable.statusSuccess', { defaultMessage: 'Success' })
              : i18n.translate('agentTraces.dataTable.statusError', { defaultMessage: 'Error' })}
          </EuiHealth>
        );
      case 'kind':
        return <KindBadge row={row} />;
      case 'latency':
        return row.latency;
      default: {
        const text =
          key === 'input'
            ? previewSpanInput(row)
            : key === 'output'
              ? previewSpanOutput(row)
              : row.name;
        return text ? <span onMouseEnter={setTitleIfTruncated(text)}>{text}</span> : '—';
      }
    }
  };

  return (
    <div className="agentTraces-table-container">
      <table className="agentTraces-table table" data-test-subj="agentTracesSessionDrillTable">
        <thead>
          <tr className="agentTracesDocTableHeader">
            {COLUMNS.map((c) => (
              <TableHeaderColumn
                key={c.key}
                name={c.key}
                displayName={c.label}
                isRemoveable={false}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, renderedCount).map((row) => (
            <tr key={row.spanId} className="agtSessionsTable__row" onClick={() => onRowClick(row)}>
              {COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className={`agentTracesDocTableCell${
                    c.wideText ? ' agentTracesDocTableCell--wideText' : ' eui-textNoWrap'
                  }`}
                >
                  <div className="agentTracesDocTableCell__content">
                    <span className="agentTracesDocTableCell__dataField">
                      {renderCell(row, c.key)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {renderedCount < rows.length && (
        <div ref={sentinelRef}>
          <EuiProgress size="xs" color="accent" />
        </div>
      )}
    </div>
  );
};
