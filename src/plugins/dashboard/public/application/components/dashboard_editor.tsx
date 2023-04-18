import React, { useEffect, useState } from "react";
import { DashboardViewport } from '../embeddable/viewport/dashboard_viewport';
import { useParams } from 'react-router-dom';
import { DashboardTopNav } from '../components/dashboard_top_nav'
import { useChromeVisibility } from '../utils/use/use_chrome_visibility'
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public'
import { EventEmitter } from 'events';
import { useSavedDashboardInstance } from "../utils/use/use_saved_dashboard_instance";
import { useDashboardAppState } from "../utils/use/use_dashboard_app_state";
import { DashboardServices } from "../../types";
import { DashboardStateManager } from "../dashboard_state_manager";

export const DashboardEditor = () => {
    const { id: dashboardIdFromUrl } = useParams<{ id: string }>();
    const { services } = useOpenSearchDashboards<DashboardServices>();
    const { dashboardConfig, pluginInitializerContext, osdUrlStateStorage, history, usageCollection } = services;
    const isChromeVisible = useChromeVisibility(services.chrome);
    const [eventEmitter] = useState(new EventEmitter());

    const { savedDashboardInstance } = useSavedDashboardInstance(
        services, 
        eventEmitter, 
        isChromeVisible, 
        dashboardIdFromUrl
    )

    console.log("in editor, saved dashboard", savedDashboardInstance)

    const { appState } = useDashboardAppState(
        services, 
        eventEmitter,
        savedDashboardInstance
    )

    console.log("in editor, saved app state", appState)

    /*const dashboardStateManager = new DashboardStateManager({
        savedDashboard: savedDashboardInstance,
        hideWriteControls: dashboardConfig.getHideWriteControls(),
        opensearchDashboardsVersion: pluginInitializerContext.env.packageInfo.version,
        osdUrlStateStorage,
        history,
        usageCollection,
      });*/

   /* const { currentAppState } = useEditorUpdates(
        services, 
        eventEmitter, 
        setHasUnsavedChanges,
        appState,
        savedDashboardInstance
    )

    useEffect(() => {
        // clean up all registered listeners if any is left
        return () => {
          eventEmitter.removeAllListeners();
        };
      }, [eventEmitter]);*/

    return (
        <DashboardTopNav 
            isChromeVisible={isChromeVisible}
            savedDashboardInstance={savedDashboardInstance}
            appState={appState}
        />
  
    )
}