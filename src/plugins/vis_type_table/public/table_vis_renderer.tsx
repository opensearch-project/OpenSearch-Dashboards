/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import { CoreStart } from 'opensearch-dashboards/public';
import { VisualizationContainer } from '../../visualizations/public';
import { ExpressionRenderDefinition } from '../../expressions/common/expression_renderers';
import { TableVisRenderValue } from './table_vis_fn';
import { TableVisApp } from './components/table_vis_app';

export const getTableVisRenderer: (
  core: CoreStart
) => ExpressionRenderDefinition<TableVisRenderValue> = (core) => ({
  name: 'table_vis',
  displayName: 'table visualization',
  reuseDomNode: true,
  render: async (domNode, { visData, visConfig }, handlers) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    const showNoResult = visData.table
      ? visData.table.rows.length === 0
      : visData.tableGroups?.length === 0;
    render(
      <VisualizationContainer className="tableVis" showNoResult={showNoResult}>
        <TableVisApp services={core} visData={visData} visConfig={visConfig} handlers={handlers} />
      </VisualizationContainer>,
      domNode
    );
  },
});
