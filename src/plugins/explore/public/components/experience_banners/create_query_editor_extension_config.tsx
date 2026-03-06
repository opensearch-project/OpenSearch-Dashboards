/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { map } from 'rxjs/operators';
import { QueryEditorExtensionConfig } from '../../../../data/public';
import { ExplorePluginStart, ExploreStartDependencies } from '../../types';

export const createQueryEditorExtensionConfig = (
  core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>
): QueryEditorExtensionConfig => {
  return {
    id: 'explore-plugin-extension',
    order: 1,
    // Disable all banners - users should use workspace switching instead
    isEnabled$: () =>
      core.workspaces.currentWorkspace$.pipe(
        map(() => false) // Never show any banners
      ),
    getBanner: () => {
      // Return null component since banners are completely disabled
      return null;
    },
  };
};
