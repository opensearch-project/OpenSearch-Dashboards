/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { I18nProvider } from '@osd/i18n/react';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

import { TableContext } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { TableVisComponent } from './table_vis_component';

interface TableVisAppProps {
  visData: TableContext;
  visConfig: TableVisConfig;
  handlers: IInterpreterRenderHandlers;
}

export const TableVisApp = ({
  services,
  visData: { table, tableGroups, direction },
  visConfig,
  handlers,
}: TableVisAppProps & { services: CoreStart }) => {
  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <div className="tableVis" data-test-subj="tableVisEditor">
          {table ? (
            <TableVisComponent table={table} visConfig={visConfig} handlers={handlers} />
          ) : (
            <></>
          )}
        </div>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
};

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { TableVisApp as default };
