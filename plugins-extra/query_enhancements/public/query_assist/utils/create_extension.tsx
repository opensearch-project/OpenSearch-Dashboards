import React from 'react';
import { HttpSetup } from 'opensearch-dashboards/public';
import { QueryAssistBar } from '../components';
import { SearchBarExtensionConfig } from '../../../../../src/plugins/data/public/ui/search_bar_extensions';

export const createQueryAssistExtension = (
  http: HttpSetup,
  language: string
): SearchBarExtensionConfig => {
  return {
    id: 'query-assist',
    order: 1000,
    isEnabled: (() => {
      let agentConfigured: boolean;
      return async (dependencies) => {
        // currently query assist tool relies on opensearch API to get index
        // mappings, other data sources are not supported
        if (dependencies.dataSource && dependencies.dataSource?.getType() !== 'default')
          return false;
        if (agentConfigured === undefined) {
          agentConfigured = await http
            .get<{ configured: boolean }>(`/api/ql/query_assist/configured/${language}`)
            .then((response) => response.configured)
            .catch(() => false);
        }
        return agentConfigured;
      };
    })(),
    getComponent: (dependencies) => (
      <QueryAssistBar language={language} dependencies={dependencies} />
    ),
  };
};
