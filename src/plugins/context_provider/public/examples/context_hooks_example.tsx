/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButton, EuiFieldText, EuiFormRow, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { usePageContext } from '../hooks/use_page_context';
import { useDynamicContext, useArrayContext } from '../hooks/use_dynamic_context';

/**
 * Example component demonstrating the usage of context hooks
 * This is for documentation and testing purposes
 */
export const ContextHooksExample: React.FC = () => {
  // Example 1: Zero-config page context
  const pageContextId = usePageContext();

  // Example 2: Custom page context with conversion
  const customPageContextId = usePageContext({
    description: "Current dashboard state",
    convert: (urlState) => ({
      app: urlState.pathname.split('/')[2], // Extract app name from path
      dashboardId: urlState._a?.dashboardId,
      timeRange: urlState._g?.time,
      filters: urlState._g?.filters,
    }),
    categories: ['dashboard', 'page']
  });

  // Example 3: Dynamic React state context
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const selectionContextId = useDynamicContext({
    description: "Currently selected items",
    value: selectedItems,
    label: `${selectedItems.length} items selected`,
    categories: ['selection', 'ui-state']
  });

  // Example 4: Form state context
  const [formData, setFormData] = useState({ name: '', email: '' });
  const formContextId = useDynamicContext({
    description: "Current form data",
    value: formData,
    categories: ['form', 'user-input']
  });

  // Example 5: Array context with convenience hook
  const [todoItems, setTodoItems] = useState(['Task 1', 'Task 2']);
  const todoContextId = useArrayContext(
    "Todo items",
    todoItems,
    ['todos', 'tasks']
  );

  const addSelectedItem = () => {
    const newItem = `Item ${selectedItems.length + 1}`;
    setSelectedItems([...selectedItems, newItem]);
  };

  const removeSelectedItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const addTodoItem = () => {
    const newTodo = `Task ${todoItems.length + 1}`;
    setTodoItems([...todoItems, newTodo]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <EuiTitle size="l">
        <h1>Context Hooks Examples</h1>
      </EuiTitle>
      <EuiSpacer />

      <EuiPanel>
        <EuiTitle size="m">
          <h2>1. Page Context (Zero Config)</h2>
        </EuiTitle>
        <EuiText>
          <p>Automatically captures URL state including OpenSearch Dashboards parameters.</p>
          <p><strong>Context ID:</strong> {pageContextId}</p>
        </EuiText>
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle size="m">
          <h2>2. Custom Page Context</h2>
        </EuiTitle>
        <EuiText>
          <p>Page context with custom conversion function for dashboard-specific data.</p>
          <p><strong>Context ID:</strong> {customPageContextId}</p>
        </EuiText>
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle size="m">
          <h2>3. Dynamic Selection Context</h2>
        </EuiTitle>
        <EuiText>
          <p>Tracks selected items state and updates context automatically.</p>
          <p><strong>Context ID:</strong> {selectionContextId}</p>
          <p><strong>Selected Items:</strong> {selectedItems.join(', ') || 'None'}</p>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiButton onClick={addSelectedItem} size="s">
          Add Item
        </EuiButton>
        {selectedItems.map((item, index) => (
          <EuiButton
            key={index}
            onClick={() => removeSelectedItem(index)}
            size="s"
            color="danger"
            style={{ marginLeft: '8px' }}
          >
            Remove {item}
          </EuiButton>
        ))}
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle size="m">
          <h2>4. Form State Context</h2>
        </EuiTitle>
        <EuiText>
          <p>Tracks form input state for assistant context.</p>
          <p><strong>Context ID:</strong> {formContextId}</p>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiFormRow label="Name">
          <EuiFieldText
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </EuiFormRow>
        <EuiFormRow label="Email">
          <EuiFieldText
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </EuiFormRow>
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle size="m">
          <h2>5. Array Context (Todo Items)</h2>
        </EuiTitle>
        <EuiText>
          <p>Tracks array state with automatic count in label.</p>
          <p><strong>Context ID:</strong> {todoContextId}</p>
          <p><strong>Todo Items:</strong> {todoItems.join(', ')}</p>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiButton onClick={addTodoItem} size="s">
          Add Todo
        </EuiButton>
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel color="subdued">
        <EuiTitle size="s">
          <h3>How it works</h3>
        </EuiTitle>
        <EuiText size="s">
          <ul>
            <li>All contexts are automatically registered with the assistant context store</li>
            <li>Contexts are sent to the AI agent through the AG-UI protocol</li>
            <li>Changes to React state automatically update the context</li>
            <li>Contexts are cleaned up when components unmount</li>
            <li>Categories allow filtering contexts for different use cases</li>
          </ul>
        </EuiText>
      </EuiPanel>
    </div>
  );
};