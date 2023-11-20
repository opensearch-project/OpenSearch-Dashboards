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
import { useVisBuilderState, VisBuilderContextValue } from '../utils/use_vis_builder_state';

// Define the context for VisBuilder
const VBContext = React.createContext<VisBuilderContextValue>({} as VisBuilderContextValue);

// eslint-disable-next-line import/no-default-export
export default function VisBuilderContext({ children }: React.PropsWithChildren<ViewProps>) {
  const { services: deServices } = useOpenSearchDashboards<DataExplorerServices>();
  const { services: vbServices } = useOpenSearchDashboards<VisBuilderServices>();
  const services: VisBuilderViewServices = { ...deServices, ...vbServices };
  const visBuilderParams = useVisBuilderState(services);

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <VBContext.Provider value={visBuilderParams}>{children}</VBContext.Provider>
    </OpenSearchDashboardsContextProvider>
  );
}

// Export the useVisBuilderContext hook for VisBuilder
export const useVisBuilderContext = () => React.useContext(VBContext);
