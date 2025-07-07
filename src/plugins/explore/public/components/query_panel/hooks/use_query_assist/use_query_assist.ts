/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import {
  QueryAssistParameters,
  QueryAssistResponse,
} from '../../../../../../query_enhancements/common/query_assist';

export const useQueryAssist = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Check if query assist is available through data plugin extension system
  const isAvailable = useMemo(() => {
    try {
      const extensions = services.data.query.queryString
        .getLanguageService()
        .getQueryEditorExtensionMap();

      return !!extensions['query-assist'];
    } catch (error) {
      // If query enhancements is not available, extensions will be undefined
      return false;
    }
  }, [services]);

  // Generate query using existing query assist API
  const generateQuery = useCallback(
    async (question: string, dataset: Dataset): Promise<QueryAssistResponse> => {
      if (!isAvailable) {
        throw new Error(
          'Query assist is not available. Please ensure query enhancements plugin is enabled.'
        );
      }

      const params: QueryAssistParameters = {
        question,
        index: dataset.title,
        language: 'PPL',
        dataSourceId: dataset.dataSource?.id,
      };

      const response = await services.http.post<QueryAssistResponse>(
        '/api/enhancements/assist/generate',
        {
          body: JSON.stringify(params),
        }
      );

      return response;
    },
    [services, isAvailable]
  );

  return {
    isAvailable,
    generateQuery,
  };
};
