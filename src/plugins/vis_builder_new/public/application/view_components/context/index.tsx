/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DataExplorerServices, ViewProps } from '../../../../../data_explorer/public';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices, VisBuilderViewServices } from '../../../types';

// Define the context for VisBuilder
const VBContext = React.createContext<VisBuilderViewServices>({} as VisBuilderViewServices);

// eslint-disable-next-line import/no-default-export
export default function VisBuilderContext({ children }: React.PropsWithChildren<ViewProps>) {
  const { services: deServices } = useOpenSearchDashboards<DataExplorerServices>();
  const { services: vbServices } = useOpenSearchDashboards<VisBuilderServices>();
  const services: VisBuilderViewServices = { ...deServices, ...vbServices };

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <VBContext.Provider value={services}>{children}</VBContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

// Export the useContext hook for VisBuilder
export const useVisBuilderContext = () => React.useContext(VBContext);
