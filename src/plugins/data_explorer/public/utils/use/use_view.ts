/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { useTypedDispatch, useTypedSelector } from '../state_management';
import { setView } from '../state_management/metadata_slice';

export const useView = () => {
  const viewId = useTypedSelector((state) => state.metadata.view);
  const {
    services: { viewRegistry },
  } = useOpenSearchDashboards<DataExplorerServices>();
  const dispatch = useTypedDispatch();
  const { appId } = useParams<{ appId: string }>();

  const view = useMemo(() => {
    if (!viewId) return undefined;
    return viewRegistry.get(viewId);
  }, [viewId, viewRegistry]);

  useEffect(() => {
    const currentView = viewRegistry.get(appId);

    if (!currentView) return;

    dispatch(setView(currentView?.id));
  }, [appId, dispatch, viewRegistry]);

  return { view, viewRegistry };
};
