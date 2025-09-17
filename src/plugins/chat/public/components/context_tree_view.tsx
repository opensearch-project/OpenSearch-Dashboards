/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import {
  EuiTreeView,
  EuiToken,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiToolTip,
} from '@elastic/eui';
import { StaticContext, DynamicContext } from '../../../context_provider/public';

interface ContextTreeViewProps {
  staticContext: StaticContext | null;
  dynamicContext: DynamicContext | null;
}

interface TreeNode {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactElement;
  children?: TreeNode[];
}

export const ContextTreeView: React.FC<ContextTreeViewProps> = ({
  staticContext,
  dynamicContext,
}) => {
  // Helper function to render truncated badges with tooltips
  const renderTruncatedBadge = useCallback((value: string, maxLength: number = 30) => {
    const stringValue = String(value);
    const shouldTruncate = stringValue.length > maxLength;
    const displayValue = shouldTruncate ? `${stringValue.slice(0, maxLength)}...` : stringValue;

    const badge = <EuiBadge color="hollow">{displayValue}</EuiBadge>;

    return shouldTruncate ? <EuiToolTip content={stringValue}>{badge}</EuiToolTip> : badge;
  }, []);
  // Helper function to recursively build tree nodes from any data structure
  const buildDataNodes = useMemo(
    () => (data: any, idPrefix: string, level = 0): TreeNode[] => {
      const nodes: TreeNode[] = [];

      if (data === null || data === undefined) {
        return nodes;
      }

      // Handle different data types
      if (typeof data === 'object' && !Array.isArray(data)) {
        // Handle objects
        Object.entries(data).forEach(([key, value], index) => {
          const nodeId = `${idPrefix}-${key}-${index}`;

          if (value === null || value === undefined) {
            nodes.push({
              id: nodeId,
              icon: <EuiToken iconType="tokenNull" color="euiColorMediumShade" />,
              label: (
                <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <strong>{key}:</strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" color="subdued">
                      null
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ),
            });
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Nested object
            const children = buildDataNodes(value, nodeId, level + 1);
            nodes.push({
              id: nodeId,
              icon: <EuiToken iconType="tokenObject" color="euiColorVis1" />,
              label: (
                <EuiText size="s">
                  <strong>{key}</strong>
                </EuiText>
              ),
              children: children.length > 0 ? children : undefined,
            });
          } else if (Array.isArray(value)) {
            // Array
            const arrayChildren = value.map((item, arrayIndex) => {
              const arrayNodeId = `${nodeId}-${arrayIndex}`;
              if (typeof item === 'object') {
                return {
                  id: arrayNodeId,
                  icon: <EuiToken iconType="tokenObject" color="euiColorVis2" />,
                  label: <EuiText size="s">[{arrayIndex}]</EuiText>,
                  children: buildDataNodes(item, arrayNodeId, level + 2),
                };
              } else {
                return {
                  id: arrayNodeId,
                  icon: <EuiToken iconType="tokenString" color="euiColorVis3" />,
                  label: (
                    <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s">[{arrayIndex}]:</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>{renderTruncatedBadge(String(item))}</EuiFlexItem>
                    </EuiFlexGroup>
                  ),
                };
              }
            });

            nodes.push({
              id: nodeId,
              icon: <EuiToken iconType="tokenArray" color="euiColorVis4" />,
              label: (
                <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <strong>{key}</strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color="hollow">{value.length} items</EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ),
              children: arrayChildren,
            });
          } else {
            // Primitive values
            const valueType = typeof value;
            let icon = <EuiToken iconType="tokenString" color="euiColorVis5" />;

            if (valueType === 'boolean') {
              icon = <EuiToken iconType="tokenBoolean" color="euiColorVis6" />;
            } else if (valueType === 'number') {
              icon = <EuiToken iconType="tokenNumber" color="euiColorVis7" />;
            }

            nodes.push({
              id: nodeId,
              icon,
              label: (
                <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <strong>{key}:</strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>{renderTruncatedBadge(String(value))}</EuiFlexItem>
                </EuiFlexGroup>
              ),
            });
          }
        });
      }

      return nodes;
    },
    [renderTruncatedBadge]
  );

  const treeItems = useMemo(() => {
    const items: TreeNode[] = [];

    // Static Context Tree
    if (staticContext) {
      const staticChildren: TreeNode[] = [];

      // Add appId as a top-level field
      if (staticContext.appId) {
        staticChildren.push({
          id: 'static-appId',
          icon: <EuiToken iconType="apps" color="euiColorVis1" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>App ID:</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>{renderTruncatedBadge(staticContext.appId)}</EuiFlexItem>
            </EuiFlexGroup>
          ),
        });
      }

      // Add all data fields recursively
      const dataNodes = buildDataNodes(staticContext.data, 'static-data');
      staticChildren.push(...dataNodes);

      if (staticChildren.length > 0) {
        items.push({
          id: 'static-context',
          icon: <EuiToken iconType="documents" color="euiColorVis1" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>Static Context</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="primary">
                  {new Date(staticContext.timestamp).toLocaleTimeString()}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: staticChildren,
        });
      }
    }

    // Dynamic Context Tree
    if (dynamicContext) {
      const dynamicChildren: TreeNode[] = [];

      // Add trigger as a top-level field
      dynamicChildren.push({
        id: 'dynamic-trigger',
        icon: <EuiToken iconType="bolt" color="euiColorVis2" />,
        label: (
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>Trigger:</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>{renderTruncatedBadge(dynamicContext.trigger)}</EuiFlexItem>
          </EuiFlexGroup>
        ),
      });

      // Add appId if present
      if (dynamicContext.appId) {
        dynamicChildren.push({
          id: 'dynamic-appId',
          icon: <EuiToken iconType="apps" color="euiColorVis3" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>App ID:</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>{renderTruncatedBadge(dynamicContext.appId)}</EuiFlexItem>
            </EuiFlexGroup>
          ),
        });
      }

      // Add all data fields recursively
      const dataNodes = buildDataNodes(dynamicContext.data, 'dynamic-data');
      dynamicChildren.push(...dataNodes);

      if (dynamicChildren.length > 0) {
        items.push({
          id: 'dynamic-context',
          icon: <EuiToken iconType="bolt" color="euiColorVis2" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>Dynamic Context</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="accent">
                  {new Date(dynamicContext.timestamp).toLocaleTimeString()}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: dynamicChildren,
        });
      }
    }

    return items;
  }, [staticContext, dynamicContext, buildDataNodes, renderTruncatedBadge]);

  if (treeItems.length === 0) {
    return (
      <EuiText size="s" color="subdued" textAlign="center">
        No context available
      </EuiText>
    );
  }

  return (
    <>
      <EuiTreeView
        items={treeItems}
        display="compressed"
        showExpansionArrows
        aria-label="Context information"
      />
    </>
  );
};
