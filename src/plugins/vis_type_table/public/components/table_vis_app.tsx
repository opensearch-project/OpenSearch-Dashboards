/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_vis_app.scss';
import React from 'react';
import classNames from 'classnames';
import { CoreStart } from 'opensearch-dashboards/public';
import { I18nProvider } from '@osd/i18n/react';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

import { TableContext } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { TableVisComponent } from './table_vis_component';
import { TableVisComponentGroup } from './table_vis_component_group';

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
  const className = classNames('visTable', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    visTable__groupInColumns: direction === 'column',
  });

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <div className={className} data-test-subj="visTable">
          {table ? (
            <TableVisComponent table={table} visConfig={visConfig} handlers={handlers} />
          ) : (
            <TableVisComponentGroup
              tableGroups={tableGroups}
              visConfig={visConfig}
              handlers={handlers}
            />
          )}
        </div>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
};

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { TableVisApp as default };
