/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';

export interface TraceTreeToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  /** 1-based position of the selected span among matches, 0 when not on a match. */
  matchPosition: number;
  onStepMatch: (direction: 1 | -1) => void;
  errorCount: number;
  onNextError: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

/** Search, jump-to-error and expand/collapse controls above the trace tree. */
export const TraceTreeToolbar: React.FC<TraceTreeToolbarProps> = ({
  query,
  onQueryChange,
  matchCount,
  matchPosition,
  onStepMatch,
  errorCount,
  onNextError,
  onExpandAll,
  onCollapseAll,
}) => {
  const hasQuery = query.trim() !== '';
  return (
    <EuiFlexGroup
      className="agentTracesFlyout__treeToolbar"
      gutterSize="xs"
      alignItems="center"
      responsive={false}
    >
      <EuiFlexItem>
        <EuiFieldSearch
          compressed
          fullWidth
          isClearable
          value={query}
          placeholder={i18n.translate('agentTraces.traceTree.searchPlaceholder', {
            defaultMessage: 'Search spans',
          })}
          aria-label={i18n.translate('agentTraces.traceTree.searchAriaLabel', {
            defaultMessage: 'Search spans in this trace',
          })}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onStepMatch(e.shiftKey ? -1 : 1);
            }
          }}
          data-test-subj="agentTracesTreeSearch"
        />
      </EuiFlexItem>
      {hasQuery && (
        <>
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued" data-test-subj="agentTracesTreeMatchCount">
              {i18n.translate('agentTraces.traceTree.matchCount', {
                defaultMessage: '{position}/{count}',
                values: { position: matchPosition, count: matchCount },
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="arrowUp"
              size="xs"
              color="text"
              isDisabled={matchCount === 0}
              onClick={() => onStepMatch(-1)}
              aria-label={i18n.translate('agentTraces.traceTree.previousMatch', {
                defaultMessage: 'Previous match',
              })}
              data-test-subj="agentTracesTreePrevMatch"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="arrowDown"
              size="xs"
              color="text"
              isDisabled={matchCount === 0}
              onClick={() => onStepMatch(1)}
              aria-label={i18n.translate('agentTraces.traceTree.nextMatch', {
                defaultMessage: 'Next match',
              })}
              data-test-subj="agentTracesTreeNextMatch"
            />
          </EuiFlexItem>
        </>
      )}
      {errorCount > 0 && (
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={i18n.translate('agentTraces.traceTree.nextErrorTooltip', {
              defaultMessage: 'Jump to next error span',
            })}
          >
            <EuiButtonEmpty
              size="xs"
              color="danger"
              iconType="alert"
              onClick={onNextError}
              data-test-subj="agentTracesTreeNextError"
            >
              {i18n.translate('agentTraces.traceTree.errorCount', {
                defaultMessage: '{count, plural, one {# error} other {# errors}}',
                values: { count: errorCount },
              })}
            </EuiButtonEmpty>
          </EuiToolTip>
        </EuiFlexItem>
      )}
      {onExpandAll && (
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={i18n.translate('agentTraces.traceTree.expandAll', {
              defaultMessage: 'Expand all',
            })}
          >
            <EuiButtonIcon
              iconType="unfold"
              size="xs"
              color="text"
              onClick={onExpandAll}
              aria-label={i18n.translate('agentTraces.traceTree.expandAll', {
                defaultMessage: 'Expand all',
              })}
              data-test-subj="agentTracesTreeExpandAll"
            />
          </EuiToolTip>
        </EuiFlexItem>
      )}
      {onCollapseAll && (
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={i18n.translate('agentTraces.traceTree.collapseAll', {
              defaultMessage: 'Collapse all',
            })}
          >
            <EuiButtonIcon
              iconType="fold"
              size="xs"
              color="text"
              onClick={onCollapseAll}
              aria-label={i18n.translate('agentTraces.traceTree.collapseAll', {
                defaultMessage: 'Collapse all',
              })}
              data-test-subj="agentTracesTreeCollapseAll"
            />
          </EuiToolTip>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
