import React, { useEffect, useState } from "react";
import { DashboardViewport } from '../embeddable/viewport/dashboard_viewport';
import { useParams } from 'react-router-dom';
import { DashboardTopNav } from './dashboard_top_nav'
import { useChromeVisibility } from '../utils/use/use_chrome_visibility'
import { DashboardServices} from '../types'
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public'

export const DashboardEditor = () => {
    const { id: dashboardIdFromUrl } = useParams<{ id: string }>();
    const { services } = useOpenSearchDashboards<DashboardServices>();
    const isChromeVisible = useChromeVisibility(services.chrome);
    const [eventEmitter] = useState(new EventEmitter());

    const { savedDashboardInstance } = useSavedDashboardInstance(
        services, 
        eventEmitter, 
        isChromeVisible, 
        dashboardIdFromUrl
    )

    const { appState } = useDashboardAppState(
        services, 
        eventEmitter, 
        savedDashboardInstance
    )

    const { currentAppState } = useEditorUpdates(
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
      }, [eventEmitter]);

    return (
        <DashboardTopNav 
            isChromeVisible={isChromeVisible}
        />
    )
}