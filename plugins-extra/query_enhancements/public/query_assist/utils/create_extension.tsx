import { HttpSetup } from 'opensearch-dashboards/public';
import React from 'react';
import { getMdsDataSourceId } from '.';
import { SearchBarExtensionConfig } from '../../../../../src/plugins/data/public/ui/search_bar_extensions';
import { getData } from '../../services';
import { QueryAssistBar } from '../components';

export const createQueryAssistExtension = (
  http: HttpSetup,
  language: string
): SearchBarExtensionConfig => {
  return {
    id: 'query-assist',
    order: 1000,
    isEnabled: (() => {
      const agentConfiguredMap: Map<string | undefined, boolean> = new Map();
      return async (dependencies) => {
        // currently query assist tool relies on opensearch API to get index
        // mappings, other data sources are not supported
        if (dependencies.dataSource && dependencies.dataSource?.getType() !== 'default')
          return false;

        const dataSourceId = await getMdsDataSourceId(
          getData().indexPatterns,
          dependencies.indexPatterns?.at(0)
        );
        const cached = agentConfiguredMap.get(dataSourceId);
        if (cached !== undefined) return cached;
        const configured = await http
          .get<{ configured: boolean }>(`/api/ql/query_assist/configured/${language}`, {
            query: { dataSourceId },
          })
          .then((response) => response.configured)
          .catch(() => false);
        agentConfiguredMap.set(dataSourceId, configured);
        return configured;
      };
    })(),
    getComponent: (dependencies) => (
      <QueryAssistBar language={language} dependencies={dependencies} />
    ),
  };
};
