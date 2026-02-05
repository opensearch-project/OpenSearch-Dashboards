/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  EuiTreeView,
  EuiToken,
  EuiText,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiToolTip,
} from '@elastic/eui';
import type { AssistantContextOptions } from '../../../context_provider/public';

interface ContextTreeViewProps {
  staticCategory?: string;
  dynamicCategory?: string;
}

interface TreeNode {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactElement;
  children?: TreeNode[];
}

export const ContextTreeView: React.FC<ContextTreeViewProps> = ({
  staticCategory = 'static',
  dynamicCategory = 'dynamic',
}) => {
  const [staticContexts, setStaticContexts] = useState<AssistantContextOptions[]>([]);
  const [dynamicContexts, setDynamicContexts] = useState<AssistantContextOptions[]>([]);

  useEffect(() => {
    const contextStore = (window as any).assistantContextStore;

    if (!contextStore) {
      return;
    }

    const updateContexts = () => {
      const staticCtx = contextStore.getContextsByCategory(staticCategory);
      const dynamicCtx = contextStore.getContextsByCategory(dynamicCategory);
      setStaticContexts(staticCtx);
      setDynamicContexts(dynamicCtx);
    };

    updateContexts();

    const unsubscribe = contextStore.subscribe(() => {
      updateContexts();
    });

    return () => {
      unsubscribe();
    };
  }, [staticCategory, dynamicCategory]);

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
    if (staticContexts.length > 0) {
      const staticChildren: TreeNode[] = [];

      staticContexts.forEach((context, index) => {
        // Add all data fields directly to static children (flatten structure)
        if (context.value) {
          const dataNodes = buildDataNodes(context.value, `static-${index}-data`);
          staticChildren.push(...dataNodes);
        }
      });

      if (staticChildren.length > 0) {
        items.push({
          id: 'static-context-root',
          icon: <EuiToken iconType="documents" color="euiColorVis1" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>Static Context</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="primary">{staticContexts.length} items</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: staticChildren,
        });
      }
    }

    // Dynamic Context Tree
    if (dynamicContexts.length > 0) {
      const dynamicChildren: TreeNode[] = [];

      dynamicContexts.forEach((context, index) => {
        const contextChildren: TreeNode[] = [];

        // Add description
        if (context.description) {
          contextChildren.push({
            id: `dynamic-${index}-description`,
            icon: <EuiToken iconType="tokenString" color="euiColorVis2" />,
            label: (
              <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <strong>Description:</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>{renderTruncatedBadge(context.description)}</EuiFlexItem>
              </EuiFlexGroup>
            ),
          });
        }

        // Add all data fields recursively
        if (context.value) {
          const dataNodes = buildDataNodes(context.value, `dynamic-${index}-data`);
          contextChildren.push(...dataNodes);
        }

        dynamicChildren.push({
          id: `dynamic-context-${index}`,
          icon: <EuiToken iconType="bolt" color="euiColorVis2" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>{context.label || `Context ${index + 1}`}</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="accent">Dynamic</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: contextChildren.length > 0 ? contextChildren : undefined,
        });
      });

      if (dynamicChildren.length > 0) {
        items.push({
          id: 'dynamic-context-root',
          icon: <EuiToken iconType="bolt" color="euiColorVis2" />,
          label: (
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>Dynamic Context</strong>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color="accent">{dynamicContexts.length} items</EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          ),
          children: dynamicChildren,
        });
      }
    }

    return items;
  }, [staticContexts, dynamicContexts, buildDataNodes, renderTruncatedBadge]);

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
