/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { WorkspaceTemplate } from '../../../core/types';

export function useWorkspaceTemplate(application: ApplicationStart) {
  let workspaceTemplates = [] as WorkspaceTemplate[];
  const templateFeatureMap = new Map<string, PublicAppInfo[]>();

  application.applications$.subscribe((applications) =>
    applications.forEach((app) => {
      const { workspaceTemplate: templates = [] } = app;
      workspaceTemplates.push(...templates);
      for (const template of templates) {
        const features = templateFeatureMap.get(template.id) || [];
        features.push(app);
        templateFeatureMap.set(template.id, features);
      }
    })
  );

  workspaceTemplates.sort((a, b) => (a.order || 0) - (b.order || 0));
  workspaceTemplates = [...new Set(workspaceTemplates)];

  return {
    workspaceTemplates,
    templateFeatureMap,
  };
}
