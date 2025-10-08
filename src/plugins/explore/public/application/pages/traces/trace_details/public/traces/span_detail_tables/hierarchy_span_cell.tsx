/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiToolTip, EuiText } from '@elastic/eui';
import React, { useEffect } from 'react';
import './span_detail_table.scss';
import { resolveServiceNameFromSpan, isSpanError } from '../ppl_resolve_helpers';
import { ParsedHit, SpanTableProps } from './types';

export const HierarchySpanCell = ({
  rowIndex,
  items,
  disableInteractions,
  props,
  setCellProps,
  expandedRows,
  setExpandedRows,
}: {
  rowIndex: number;
  items: ParsedHit[];
  disableInteractions: boolean;
  props: SpanTableProps;
  setCellProps?: (props: any) => void;
  expandedRows: Set<string>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
}) => {
  const item = items[rowIndex];
  const isRowSelected =
    item && props.selectedSpanId && props.selectedSpanId === item.spanId && !disableInteractions;

  useEffect(() => {
    if (isRowSelected) {
      setCellProps?.({
        className: ['treeCell--firstColumn', 'exploreSpanDetailTable__selectedRow'],
      });
    } else {
      setCellProps?.({ className: ['treeCell--firstColumn'] });
    }
  }, [props.selectedSpanId, item?.spanId, disableInteractions, isRowSelected, setCellProps]);

  const indentation = `${(item?.level || 0) * 20}px`;
  const isExpanded = expandedRows.has(item?.spanId);
  const serviceName = resolveServiceNameFromSpan(item);
  const operationName = item?.name;
  const hasError = isSpanError(item);

  const ExpandCollapseIcon = () =>
    item?.children && item.children.length > 0 ? (
      <EuiIcon
        type={isExpanded ? 'arrowDown' : 'arrowRight'}
        onClick={(e) => {
          e.stopPropagation();
          setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(item.spanId)) {
              newSet.delete(item.spanId);
            } else {
              newSet.add(item.spanId);
            }
            return newSet;
          });
        }}
        className="exploreSpanDetailTable__expandIcon"
        data-test-subj="treeViewExpandArrow"
      />
    ) : (
      <EuiIcon type="empty" className="exploreSpanDetailTable__hiddenIcon" />
    );

  const SpanText = () => (
    <EuiToolTip
      content={
        <EuiText size="s">
          <strong>{serviceName || '-'}</strong>
          {operationName && ` ${operationName}`}
        </EuiText>
      }
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}
      >
        <strong>{serviceName || '-'}</strong>
        {operationName && ` ${operationName}`}
      </span>
    </EuiToolTip>
  );

  const ErrorIcon = () => (hasError ? <EuiIcon type="alert" color="danger" size="s" /> : null);

  const SpanContent = () => (
    <EuiFlexGroup alignItems="center" gutterSize="none" responsive={false} style={{ minWidth: 0 }}>
      <EuiFlexItem grow={true} style={{ minWidth: 0 }}>
        <SpanText />
      </EuiFlexItem>
      {hasError && (
        <EuiFlexItem grow={false} style={{ marginLeft: '4px' }}>
          <ErrorIcon />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );

  const cellContent = (
    <div className="exploreSpanDetailTable__hierarchyCell" style={{ paddingLeft: indentation }}>
      <ExpandCollapseIcon />
      <SpanContent />
    </div>
  );

  return disableInteractions || !item ? (
    cellContent
  ) : (
    <button
      onClick={() => props.openFlyout(item.spanId)}
      style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: 0 }}
    >
      {cellContent}
    </button>
  );
};
