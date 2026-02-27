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
                      <EuiBadge className="agentTraces__categoryBadge" color={meta.color}>
                        {meta.label}
                      </EuiBadge>
                    );
                  })()}
                </EuiFlexItem>

                <span className="agentTracesFlyout__treeRowLabelText" title={node.label}>
                  <span className="agentTracesFlyout__treeRowLabelName">{node.label}</span>
                  {node.traceRow?.status === 'error' && (
                    <EuiIcon
                      type="alert"
                      color="danger"
                      size="m"
                      className="agentTracesFlyout__treeRowErrorIcon"
                    />
                  )}
                </span>
              </EuiFlexGroup>
            </EuiFlexItem>

            <EuiFlexItem grow={false} className="agentTracesFlyout__treeRowTokens">
              {node.tokens && node.tokens !== '—' && Number(node.tokens) > 0 ? (
                <EuiBadge
                  className="agentTracesFlyout__tokenBadge"
                  color="hollow"
                  iconType="kqlSelector"
                  iconSide="left"
                >
                  {node.tokens}
                </EuiBadge>
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
