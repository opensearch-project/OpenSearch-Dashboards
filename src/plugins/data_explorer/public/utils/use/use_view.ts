/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { View } from '../../services/view_service/view';
import { DataExplorerServices } from '../../types';

export const useView = () => {
  // TODO: Move the view to the redux store once the store is ready
  const [view, setView] = useState<View | undefined>();
  const { appId } = useParams<{ appId: string }>();
  const {
    services: { viewRegistry },
  } = useOpenSearchDashboards<DataExplorerServices>();

  useEffect(() => {
    const currentView = viewRegistry.get(appId);
    setView(currentView);
  }, [appId, viewRegistry]);

  return { view, viewRegistry };
};
