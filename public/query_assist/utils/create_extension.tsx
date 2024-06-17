import { HttpSetup } from 'opensearch-dashboards/public';
import React from 'react';
import { getMdsDataSourceId } from '.';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { SUPPORTED_LANGUAGES } from '../../../common/query_assist';
import { getData } from '../../services';
import { QueryAssistBar } from '../components';
import { QueryAssistBanner } from '../components/query_assist_banner';

export const createQueryAssistExtension = (http: HttpSetup): QueryEditorExtensionConfig => {
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
          .get<{ configured: boolean }>(
            `/api/ql/query_assist/configured/${dependencies.language}`,
            {
              query: { dataSourceId },
            }
          )
          .then((response) => response.configured)
          .catch(() => false);
        agentConfiguredMap.set(dataSourceId, configured);
        return configured;
      };
    })(),
    getComponent: (dependencies) => {
      // only show the component if user is on a supported language.
      // @ts-expect-error language can be an arbitrary string and fail the check
      if (!SUPPORTED_LANGUAGES.includes(dependencies.language)) return null;
      return <QueryAssistBar dependencies={dependencies} />;
    },
    getBanner: (dependencies) => {
      // advertise query assist if user is not on a supported language.
      // @ts-expect-error language can be an arbitrary string and fail the check
      if (SUPPORTED_LANGUAGES.includes(dependencies.language)) return null;
      return <QueryAssistBanner />;
    },
  };
};
