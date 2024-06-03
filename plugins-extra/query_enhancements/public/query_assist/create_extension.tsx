import React from 'react';
import { HttpSetup } from 'opensearch-dashboards/public';
import { QueryAssistBar } from './query_assist_bar';
import { SearchBarExtensionConfig } from '../../../../src/plugins/data/public/ui/search_bar_extensions';

export const createQueryAssistExtension = (http: HttpSetup): SearchBarExtensionConfig => {
  return {
    id: 'query-assist',
    order: 1000,
    isEnabled: (() => {
      let agentConfigured: boolean;
      return async () => {
        if (agentConfigured === undefined) {
          agentConfigured = await http
            .get<{ configured: boolean }>('/api/ql/query_assist/configured/ppl')
            .then((response) => response.configured)
            .catch(() => false);
        }
        return agentConfigured;
      };
    })(),
    getComponent: (dependencies) => <QueryAssistBar dependencies={dependencies} />,
  };
};
