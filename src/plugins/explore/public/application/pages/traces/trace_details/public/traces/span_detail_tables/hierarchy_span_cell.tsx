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
  colorMap,
}: {
  rowIndex: number;
  items: ParsedHit[];
  disableInteractions: boolean;
  props: SpanTableProps;
  setCellProps?: (props: any) => void;
  expandedRows: Set<string>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  colorMap?: Record<string, string>;
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

  const isExpanded = expandedRows.has(item?.spanId);
  const serviceName = resolveServiceNameFromSpan(item);
  const operationName = item?.name;
  const hasError = isSpanError(item);
  const level = item?.level || 0;
  const serviceColor = (serviceName && colorMap?.[serviceName]) || undefined;

  // The service repeats down consecutive rows of the same service; only surface
  // its name where it actually changes (the color dot always anchors it) so the
  // eye follows the operation names, not a wall of duplicated service labels.
  const prevItem = rowIndex > 0 ? items[rowIndex - 1] : undefined;
  const prevServiceName = prevItem ? resolveServiceNameFromSpan(prevItem) : undefined;
  const showService = rowIndex === 0 || serviceName !== prevServiceName;

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

  // Light vertical guides, one per ancestor level, so nesting reads without a
  // heavy indent block.
  const TreeGuides = () => (
    <>
      {Array.from({ length: level }).map((_, i) => (
        <span key={i} className="exploreSpanDetailTable__treeGuide" data-test-subj="treeGuide" />
      ))}
    </>
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
      <span className="exploreSpanDetailTable__spanLabel">
        {serviceColor && (
          <span
            className="exploreSpanDetailTable__serviceDot"
            style={{ backgroundColor: serviceColor }}
            data-test-subj="serviceDot"
          />
        )}
        {showService && (
          <span className="exploreSpanDetailTable__serviceName" data-test-subj="serviceName">
            {serviceName || '-'}
          </span>
        )}
        <span className="exploreSpanDetailTable__operationName">
          {operationName || (showService ? '' : serviceName) || '-'}
        </span>
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
    <div className="exploreSpanDetailTable__hierarchyCell">
      <TreeGuides />
      <ExpandCollapseIcon />
      <SpanContent />
    </div>
  );

  return disableInteractions || !item ? (
    cellContent
  ) : (
    <button
      onClick={() => props.openFlyout(item.spanId)}
      className="exploreSpanDetailTable__flyoutButton"
      data-test-subj={`span-hierarchy-row-${item.spanId}`}
    >
      {cellContent}
    </button>
  );
};
