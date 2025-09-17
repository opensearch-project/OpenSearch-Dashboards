/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiButtonIcon } from '@elastic/eui';
import type { ContextEntry } from '../../../context_provider/public';
import './context_pills.scss';

interface ContextPillsProps {
  category?: string;
  maxDisplay?: number;
}

export const ContextPills: React.FC<ContextPillsProps> = ({
  category = 'chat',
  maxDisplay = 5,
}) => {
  const [contexts, setContexts] = useState<ContextEntry[]>([]);

  useEffect(() => {
    const contextStore = (window as any).assistantContextStore;

    if (!contextStore) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Assistant context store not available for context pills');
      return;
    }

    const updateContexts = () => {
      const categoryContexts = contextStore.getContextsByCategory(category);
      setContexts(categoryContexts.slice(0, maxDisplay));
    };

    updateContexts();

    const unsubscribe = contextStore.subscribe(() => {
      updateContexts();
    });

    return () => {
      unsubscribe();
    };
  }, [category, maxDisplay]);

  if (contexts.length === 0) {
    return null;
  }

  const handleRemove = (contextId: string) => {
    const contextStore = (window as any).assistantContextStore;
    if (contextStore) {
      contextStore.removeContext(contextId);
    }
  };

  return (
    <div className="contextPills">
      <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
        {contexts.map((context) => (
          <EuiFlexItem grow={false} key={context.id}>
            <EuiBadge
              color="hollow"
              iconType="cross"
              iconSide="right"
              iconOnClick={() => handleRemove(context.id)}
              iconOnClickAriaLabel={`Remove ${context.label}`}
              className="contextPills__pill"
            >
              {context.label}
            </EuiBadge>
          </EuiFlexItem>
        ))}
        {contexts.length > maxDisplay && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="subdued">+{contexts.length - maxDisplay} more</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};
