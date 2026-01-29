/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import { CoreStart } from 'opensearch-dashboards/public';
import { ExpressionRenderDefinition } from '../../expressions/common/expression_renderers';
import { TableVisRenderValue } from './table_vis_fn';
import { TableVisApp } from './components/table_vis_app';

export const getTableVisRenderer: (
  core: CoreStart
) => ExpressionRenderDefinition<TableVisRenderValue> = (core) => {
  // Use WeakMap to store roots per DOM node to support multiple instances
  const rootsMap = new WeakMap<HTMLElement, Root>();

  return {
    name: 'table_vis',
    displayName: 'table visualization',
    reuseDomNode: true,
    render: async (domNode, { visData, visConfig }, handlers) => {
      let root = rootsMap.get(domNode);
      if (!root) {
        root = createRoot(domNode);
        rootsMap.set(domNode, root);
      }

      handlers.onDestroy(() => {
        const existingRoot = rootsMap.get(domNode);
        if (existingRoot) {
          existingRoot.unmount();
          rootsMap.delete(domNode);
        }
      });

      root.render(
        <TableVisApp services={core} visData={visData} visConfig={visConfig} handlers={handlers} />
      );
    },
  };
};
