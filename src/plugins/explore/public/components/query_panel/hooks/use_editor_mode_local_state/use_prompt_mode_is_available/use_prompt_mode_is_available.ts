/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../../types';

export const usePromptModeIsAvailable = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // TODO: This appears to be returning true even when the agent is unavailable. Make it return false if agent is unavailable.
  return useMemo(() => {
    try {
      const extensions = services.data.query.queryString
        .getLanguageService()
        .getQueryEditorExtensionMap();

      // Check if query assist is available through data plugin extension system
      return !!extensions['query-assist'];
    } catch (error) {
      // If query enhancements is not available, extensions will be undefined
      return false;
    }
  }, [services]);
};
