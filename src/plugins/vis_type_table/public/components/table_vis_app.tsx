/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_vis_app.scss';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { CoreStart } from 'opensearch-dashboards/public';
import { I18nProvider } from '@osd/i18n/react';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { TableContext } from '../table_vis_response_handler';
import { TableVisConfig, ColumnSort, ColumnWidth, TableUiState } from '../types';
import { TableVisComponent } from './table_vis_component';
import { TableVisComponentGroup } from './table_vis_component_group';

interface TableVisAppProps {
  services: CoreStart;
  visData: TableContext;
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

  const className = classNames('visTable', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    visTable__groupInColumns: direction === 'column',
  });

  // TODO: remove duplicate sort and width state
  // Issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2704#issuecomment-1299380818
  const [sort, setSort] = useState<ColumnSort>({ colIndex: null, direction: null });
  const [width, setWidth] = useState<ColumnWidth[]>([]);

  const tableUiState: TableUiState = { sort, setSort, width, setWidth };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <div className={className} data-test-subj="visTable">
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
        </div>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
};
