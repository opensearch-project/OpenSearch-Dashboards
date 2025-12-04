/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { TableUiState } from '../utils';
import { TableVisDynamicTable } from './table_vis_dynamic_table';

interface TableVisComponentProps {
  title?: string;
  table: FormattedTableContext;
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

export const TableVisComponent = ({
  title,
  table,
  visConfig,
  event,
  uiState,
}: TableVisComponentProps) => {
  return (
    <TableVisDynamicTable
      title={title}
      table={table}
      visConfig={visConfig}
      event={event}
      uiState={uiState}
    />
  );
};
