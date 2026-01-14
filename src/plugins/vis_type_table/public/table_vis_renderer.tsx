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
  let root: Root | null = null;

  return {
    name: 'table_vis',
    displayName: 'table visualization',
    reuseDomNode: true,
    render: async (domNode, { visData, visConfig }, handlers) => {
      if (!root) {
        root = createRoot(domNode);
      }

      handlers.onDestroy(() => {
        if (root) {
          root.unmount();
          root = null;
        }
      });

      root.render(
        <TableVisApp services={core} visData={visData} visConfig={visConfig} handlers={handlers} />
      );
    },
  };
};
