/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../common';
import { DataExplorerServices } from '../../types';
import { useTypedDispatch, useTypedSelector } from '../state_management';
import { setView } from '../state_management/metadata_slice';

export const useView = () => {
  const viewId = useTypedSelector((state) => state.metadata.view);
  const {
    services: { chrome, viewRegistry },
  } = useOpenSearchDashboards<DataExplorerServices>();
  const dispatch = useTypedDispatch();
  const { appId } = useParams<{ appId: string }>();

  const view = useMemo(() => {
    if (!viewId) return undefined;
    return viewRegistry.get(viewId);
  }, [viewId, viewRegistry]);
  const routeView = useMemo(() => viewRegistry.get(appId), [appId, viewRegistry]);

  useLayoutEffect(() => {
    chrome.setActiveNavLink(routeView?.activeNavLinkId, PLUGIN_ID);
  }, [chrome, routeView]);

  useEffect(() => {
    if (!routeView) return;

    dispatch(setView(routeView.id));
  }, [dispatch, routeView]);

  return { view, viewRegistry };
};
