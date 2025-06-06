/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  DEFAULT_NAV_GROUPS,
  isNavGroupInFeatureConfigs,
} from 'opensearch-dashboards/public';
import React from 'react';
import { map, take } from 'rxjs/operators';
import { QueryEditorExtensionConfig } from '../../../../data/public';
import { ExplorePluginStart, ExploreStartDependencies } from '../../types';
import { ExperienceBannerWrapper } from './experience_banner_wrapper';

export const createQueryEditorExtensionConfig = (
  core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>
): QueryEditorExtensionConfig => {
  return {
    id: 'explore-plugin-extension',
    order: 1,
    isEnabled$: () =>
      core.workspaces.currentWorkspace$.pipe(
        map((workspace) => workspace?.features),
        map(
          (features) =>
            (features &&
              isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
            false
        )
      ),
    getBanner: () => {
      const initializeBanners = async () => {
        const [coreStart] = await core.getStartServices();
        const currentAppId = await coreStart.application.currentAppId$.pipe(take(1)).toPromise();

        return {
          showClassicExperienceBanner: currentAppId === 'data-explorer',
          navigateToExplore: () => {
            coreStart.application.navigateToApp('explore', { replace: true });
          },
        };
      };

      return <ExperienceBannerWrapper initializeBannerWrapper={initializeBanners} />;
    },
  };
};
