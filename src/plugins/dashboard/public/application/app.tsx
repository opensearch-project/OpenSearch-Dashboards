import { AppMountParameters } from "opensearch-dashboards/public";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { DashboardConstants } from "../dashboard_constants";

export interface DashboardAppProps {
    onAppLeave: AppMountParameters['onAppLeave'];
}

export const DashboardApp = ({ onAppLeave }: DashboardAppProps) => {
    return (
        <Switch>
            <Route exact path={['/', DashboardConstants.LANDING_PAGE_PATH]}>
                <DashboardListing></DashboardListing>
            </Route>
            <Route exact path={[DashboardConstants.CREATE_NEW_DASHBOARD_URL, createDashboardEditUrl(':id')]}>
                <DashboardEditor></DashboardEditor>
            </Route>
            <DashboardNoMatch />
        </Switch>
    )
}