/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import { VisualizationContainer } from '../../visualizations/public';
import { ExpressionRenderDefinition } from '../../expressions/common/expression_renderers';
import { TableVisRenderValue } from './table_vis_fn';

export const tableVisRenderer: () => ExpressionRenderDefinition<TableVisRenderValue> = () => ({
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
        <></> //toDo: add TableVisComponent
      </VisualizationContainer>,
      domNode
    );
  },
});
