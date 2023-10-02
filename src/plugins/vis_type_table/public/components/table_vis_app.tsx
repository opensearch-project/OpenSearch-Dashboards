/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_vis_app.scss';
import React, { useEffect } from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { I18nProvider } from '@osd/i18n/react';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { EuiFlexGroup } from '@elastic/eui';
import { PersistedState } from '../../../visualizations/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { TableVisData } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { TableVisComponent } from './table_vis_component';
import { TableVisComponentGroup } from './table_vis_component_group';
import { getTableUIState, TableUiState } from '../utils';

interface TableVisAppProps {
  services: CoreStart;
  visData: TableVisData;
  visConfig: TableVisConfig;
  handlers: IInterpreterRenderHandlers;
}

export const TableVisApp = ({
  services,
  visData: { table, tableGroups, direction },
  visConfig,
  handlers,
}: TableVisAppProps) => {
  // Rendering is asynchronous, completed by handlers.done()
  useEffect(() => {
    handlers.done();
  }, [handlers]);

  const tableUiState: TableUiState = getTableUIState(handlers.uiState as PersistedState);

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <EuiFlexGroup
          className="visTable"
          data-test-subj="visTable"
          direction={direction === 'column' ? 'row' : 'column'}
          alignItems={direction === 'column' ? 'flexStart' : 'stretch'}
        >
          {table ? (
            <TableVisComponent
              table={table}
              visConfig={visConfig}
              event={handlers.event}
              uiState={tableUiState}
            />
          ) : (
            <TableVisComponentGroup
              tableGroups={tableGroups}
              visConfig={visConfig}
              event={handlers.event}
              uiState={tableUiState}
            />
          )}
        </EuiFlexGroup>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
};
