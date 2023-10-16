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
import { VisBuilderViewServices } from '../../../types';
import { useVisBuilderState, VisBuilderContextValue } from '../utils/use_vis_builder_state';
import { getVisBuilderServices } from '../../../plugin_services';
import { DragDropProvider } from '../../../application/utils/drag_drop';

// Define the context for VisBuilder
const VBContext = React.createContext<VisBuilderContextValue>({} as VisBuilderContextValue);

// eslint-disable-next-line import/no-default-export
export default function VisBuilderContext({ children }: React.PropsWithChildren<ViewProps>) {
  const { services: deServices } = useOpenSearchDashboards<DataExplorerServices>();
  const visBuilderServices = getVisBuilderServices();
  const services: VisBuilderViewServices = { ...deServices, ...visBuilderServices };
  const visBuilderParams = useVisBuilderState(services);

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <DragDropProvider>
        <VBContext.Provider value={visBuilderParams}>{children}</VBContext.Provider>
      </DragDropProvider>
    </OpenSearchDashboardsContextProvider>
  );
}

// Export the useVisBuilderContext hook for VisBuilder
export const useVisBuilderContext = () => React.useContext(VBContext);
