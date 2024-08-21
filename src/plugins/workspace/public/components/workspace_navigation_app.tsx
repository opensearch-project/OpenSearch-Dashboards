/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { useEffect } from 'react';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceUseCase } from '../types';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../utils';
import { ApplicationStart, HttpSetup, WorkspaceObject } from '../../../../core/public';

export interface WorkspaceNavigationAppProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

const navigateToWorkspaceOverview = (
  availableUseCases: WorkspaceUseCase[],
  workspace: WorkspaceObject,
  application: ApplicationStart,
  http: HttpSetup
) => {
  const currentUseCase = availableUseCases.find(
    (useCase) => useCase.id === getFirstUseCaseOfFeatureConfigs(workspace?.features ?? [])
  );
  const useCaseUrl = getUseCaseUrl(currentUseCase, workspace, application, http);
  application.navigateToUrl(useCaseUrl);
};

export const WorkspaceNavigationApp = (props: WorkspaceNavigationAppProps) => {
  const {
    services: { workspaces, application, http, uiSettings },
  } = useOpenSearchDashboards();
  const availableUseCases = useObservable(props.registeredUseCases$, []);

  useEffect(() => {
    if (!workspaces || !application || !http || !uiSettings) {
      return;
    }

    const workspaceList = workspaces.workspaceList$.getValue();

    // If user only has one workspace, go to overview page of that workspace
    if (workspaceList.length === 1) {
      const firstWorkspace = workspaceList[0];
      navigateToWorkspaceOverview(availableUseCases, firstWorkspace, application, http);
    } else {
      // Temporarily use defaultWorkspace as a placeholder
      const defaultWorkspaceId = uiSettings.get('defaultWorkspace', null);
      const defaultWorkspace = workspaceList.find(
        (workspace) => workspace.id === defaultWorkspaceId
      );
      // If user has a default workspace configured, go to overview page of that workspace
      // If user has more than one workspaces, go to homepage
      if (defaultWorkspace) {
        navigateToWorkspaceOverview(availableUseCases, defaultWorkspace, application, http);
      } else {
        application.navigateToApp('home');
      }
    }
  }, [workspaces, application, http, availableUseCases, uiSettings]);

  return null;
};
