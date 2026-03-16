/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../../../opensearch_dashboards_utils/public';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { getServices } from '../../application/legacy/discover/opensearch_dashboards_services';
import { MountPoint, ScopedHistory } from '../../../../../core/public';
import { InContextEditorProvider } from '../context';
import { updateVisualizationBuilderServices } from '../../components/visualizations/visualization_builder';
import { InContextVisEditorPage } from './in_context_vis_editor_page';

interface InContextVisEditorProps {
  exploreId?: string;
  history: ScopedHistory;
  containerId?: string;
  setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
}

export const InContextVisEditor = ({
  exploreId,
  history,
  setHeaderActionMenu,
  containerId,
}: InContextVisEditorProps) => {
  const exploreServices = useMemo(() => {
    const services = { ...getServices() };

    // Create URL state storage using Dashboard's history
    // This allows Explore state to sync with Dashboard's URL
    services.osdUrlStateStorage = createOsdUrlStateStorage({
      history,
      useHash: services.core.uiSettings.get('state:storeInSessionStorage'),
      ...withNotifyOnErrors(services.core.notifications.toasts),
    });
    services.scopedHistory = history;

    updateVisualizationBuilderServices(services);
    return services;
  }, [history]);

  return (
    <div className="inContextEditorContainer" style={{ height: '100%' }}>
      <InContextEditorProvider
        containerId={containerId}
        exploreId={exploreId}
        setHeaderActionMenu={setHeaderActionMenu}
      >
        <OpenSearchDashboardsContextProvider services={exploreServices}>
          <exploreServices.core.i18n.Context>
            <InContextVisEditorPage />
          </exploreServices.core.i18n.Context>
        </OpenSearchDashboardsContextProvider>
      </InContextEditorProvider>
    </div>
  );
};
