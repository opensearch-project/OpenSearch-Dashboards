/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiBadge,
  EuiToolTip,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import {
  getSpanCategory,
  getCategoryMeta,
  hexToRgba,
} from '../../../../services/span_categorization';
import { TreeNode } from './tree_helpers';
import './trace_tree_view.scss';

const TokenIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', marginRight: 4, flexShrink: 0 }}
  >
    <path
      d="M9 11.625C11.2782 11.625 13.125 9.77817 13.125 7.5C13.125 5.22183 11.2782 3.375 9 3.375L6.5 2H9C12.0376 2 14.5 4.46243 14.5 7.5C14.5 10.5376 12.0376 13 9 13H6.5L9 11.625Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.5 11.625C8.77817 11.625 10.625 9.77817 10.625 7.5C10.625 5.22183 8.77817 3.375 6.5 3.375C4.22183 3.375 2.375 5.22183 2.375 7.5C2.375 9.77817 4.22183 11.625 6.5 11.625ZM12 7.5C12 10.5376 9.53757 13 6.5 13C3.46243 13 1 10.5376 1 7.5C1 4.46243 3.46243 2 6.5 2C9.53757 2 12 4.46243 12 7.5Z"
      fill="currentColor"
    />
  </svg>
);

export interface TraceTreeViewProps {
  traceTreeData: TreeNode[];
  selectedNode: TreeNode | undefined;
  expandedNodes: Set<string>;
  isLoadingFullTree?: boolean;
  fullTreeError?: string;
  onSelectNode: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
}

export const TraceTreeView: React.FC<TraceTreeViewProps> = ({
  traceTreeData,
  selectedNode,
  expandedNodes,
  isLoadingFullTree,
  fullTreeError,
  onSelectNode,
  onToggleExpanded,
}) => {
  const createTreeItems = (nodes: TreeNode[], depth = 0): React.ReactNode[] => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNode?.id;
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const rowClassName = `agentTracesFlyout__treeRow${
        isSelected ? ' agentTracesFlyout__treeRow--selected' : ''
      }`;

      return (
        <div key={node.id} className="agentTracesFlyout__treeNode">
          <EuiFlexGroup
            className={rowClassName}
            alignItems="center"
            justifyContent="spaceBetween"
            gutterSize="none"
            responsive={false}
            onClick={() => onSelectNode(node.id)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectNode(node.id);
            }}
            role="button"
            tabIndex={0}
          >
            <EuiFlexItem className="agentTracesFlyout__treeRowLabelWrap">
              <EuiFlexGroup
                className="agentTracesFlyout__treeRowLabel"
                alignItems="center"
                gutterSize="xs"
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  {(() => {
                    const category = node.traceRow ? getSpanCategory(node.traceRow) : 'OTHER';
                    const meta = getCategoryMeta(category);
                    return (
                      <EuiBadge
                        className="agentTraces__categoryBadge"
                        color={meta.bgColor}
                        style={{ color: meta.textColor }}
                      >
                        {meta.label}
                      </EuiBadge>
                    );
                  })()}
                </EuiFlexItem>

                <span className="agentTracesFlyout__treeRowLabelText" title={node.label}>
                  <span className="agentTracesFlyout__treeRowLabelName">{node.label}</span>
                  {node.traceRow?.status === 'error' && (
                    <EuiToolTip
                      content={`Span error: ${node.traceRow?.statusMessage || 'Unknown error'}`}
                      position="top"
                    >
                      <EuiIcon
                        type="alert"
                        color="danger"
                        size="m"
                        className="agentTracesFlyout__treeRowErrorIcon"
                      />
                    </EuiToolTip>
                  )}
                </span>
              </EuiFlexGroup>
            </EuiFlexItem>

            <EuiFlexItem grow={false} className="agentTracesFlyout__treeRowTokens">
              {node.tokens && node.tokens !== '—' && Number(node.tokens) > 0 ? (
                <EuiToolTip
                  content={
                    <div>
                      <div>
                        Tokens:{' '}
                        {typeof node.tokens === 'number'
                          ? node.tokens.toLocaleString()
                          : node.tokens}
                      </div>
                      <hr
                        style={{
                          margin: '4px 0',
                          border: 'none',
                          borderTop: '1px solid rgba(255,255,255,0.3)',
                        }}
                      />
                      <div>Input tokens: {node.traceRow?.inputTokens ?? '—'}</div>
                      <div>Output tokens: {node.traceRow?.outputTokens ?? '—'}</div>
                    </div>
                  }
                  position="top"
                >
                  <EuiBadge
                    color="hollow"
                    iconType={() => <TokenIcon />}
                    className="agentTracesFlyout__tokenBadge"
                  >
                    {typeof node.tokens === 'number' ? node.tokens.toLocaleString() : node.tokens}
                  </EuiBadge>
                </EuiToolTip>
              ) : null}
            </EuiFlexItem>

            <EuiFlexItem grow={false} className="agentTracesFlyout__treeRowLatency">
              {node.latency && node.latency !== '—' ? (
                <EuiText size="xs" color="subdued">
                  {node.latency}
                </EuiText>
              ) : null}
            </EuiFlexItem>

            <EuiFlexItem grow={false} className="agentTracesFlyout__treeRowExpand">
              {hasChildren ? (
                <EuiIcon
                  type={isExpanded ? 'arrowDown' : 'arrowRight'}
                  size="s"
                  color="subdued"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleExpanded(node.id);
                  }}
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onToggleExpanded(node.id);
                    }
                  }}
                />
              ) : null}
            </EuiFlexItem>
          </EuiFlexGroup>

          {hasChildren && isExpanded && (
            <div className="agentTracesFlyout__treeChildren">
              <div className="agentTracesFlyout__guideLine" />
              {createTreeItems(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="agentTracesFlyout__treeWrapper">
      <EuiSpacer size="s" />
      {isLoadingFullTree ? (
        <div className="agentTracesFlyout__loadingPanel">
          <EuiLoadingSpinner size="l" />
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            <FormattedMessage
              id="agentTraces.traceTree.loadingFullTreeMessage"
              defaultMessage="Loading full trace tree..."
            />
          </EuiText>
        </div>
      ) : fullTreeError ? (
        <EuiEmptyPrompt
          iconType="alert"
          iconColor="danger"
          title={
            <h3>
              <FormattedMessage
                id="agentTraces.traceTree.errorLoadingFullTree"
                defaultMessage="Failed to load full trace tree"
              />
            </h3>
          }
          body={<p>{fullTreeError}</p>}
        />
      ) : (
        <div
          className="agentTracesFlyout__treeContainer"
          style={
            {
              flex: 1,
              '--agent-traces-row-hover-bg': euiThemeVars.euiColorLightestShade,
              '--agent-traces-row-selected-bg': hexToRgba(euiThemeVars.euiColorPrimary, 0.1),
            } as React.CSSProperties
          }
        >
          {createTreeItems(traceTreeData)}
        </div>
      )}
    </div>
  );
};
