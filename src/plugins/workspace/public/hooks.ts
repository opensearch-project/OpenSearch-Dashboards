/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { useMemo } from 'react';
import { WorkspaceTemplate } from '../../../core/types';

export function useApplications(application: ApplicationStart) {
  const applications = useObservable(application.applications$);
  return useMemo(() => {
    const apps: PublicAppInfo[] = [];
    applications?.forEach((app) => {
      apps.push(app);
    });
    return apps;
  }, [applications]);
}

export function useWorkspaceTemplate(application: ApplicationStart) {
  const applications = useObservable(application.applications$);

  return useMemo(() => {
    const tempWsTemplates = [] as WorkspaceTemplate[];
    let workspaceTemplates = [] as WorkspaceTemplate[];
    const templateFeatureMap = new Map<string, PublicAppInfo[]>();

    if (applications) {
      applications.forEach((app) => {
        const { workspaceTemplate: templates = [] } = app;
        tempWsTemplates.push(...templates);
        for (const template of templates) {
          const features = templateFeatureMap.get(template.id) || [];
          features.push(app);
          templateFeatureMap.set(template.id, features);
        }
      });

      workspaceTemplates = tempWsTemplates.reduce((list, curr) => {
        if (!list.find((ws) => ws.id === curr.id)) {
          list.push(curr);
        }
        return list;
      }, [] as WorkspaceTemplate[]);
      workspaceTemplates.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return { workspaceTemplates, templateFeatureMap };
  }, [applications]);
}
