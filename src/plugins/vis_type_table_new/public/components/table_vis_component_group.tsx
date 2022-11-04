/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { TableGroup } from '../table_vis_response_handler';
import { TableVisConfig, TableUiState } from '../types';
import { TableVisComponent } from './table_vis_component';

interface TableVisGroupComponentProps {
  tableGroups: TableGroup[];
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

export const TableVisComponentGroup = memo(
  ({ tableGroups, visConfig, event, uiState }: TableVisGroupComponentProps) => {
    return (
      <>
        {tableGroups.map(({ tables, title }) => (
          <div key={title} className="visTable__group">
            <TableVisComponent
              title={title}
              table={tables[0]}
              visConfig={visConfig}
              event={event}
              uiState={uiState}
            />
          </div>
        ))}
      </>
    );
  }
);
