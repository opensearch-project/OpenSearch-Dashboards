/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { DATA_STRUCTURE_META_TYPES, DEFAULT_DATA } from '../../../../data/common';
import {
  DataPublicPluginSetup,
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { API } from '../../../common';
import { ConfigSchema } from '../../../common/config';
import assistantMark from '../../assets/query_assist_mark.svg';
import { QueryAssistBanner, QueryAssistBar } from '../components';

const [getAvailableLanguagesForDataSource, clearCache] = (() => {
  const availableLanguagesByDataSource: Map<string | undefined, string[]> = new Map();
  const pendingRequests: Map<string | undefined, Promise<string[]>> = new Map();

  return [
    async (http: HttpSetup, dataSourceId: string | undefined) => {
      const cached = availableLanguagesByDataSource.get(dataSourceId);
      if (cached !== undefined) return cached;

      const pendingRequest = pendingRequests.get(dataSourceId);
      if (pendingRequest !== undefined) return pendingRequest;

      const languagesPromise = http
        .get<{ configuredLanguages: string[] }>(API.QUERY_ASSIST.LANGUAGES, {
          query: { dataSourceId },
        })
        .then((response) => response.configuredLanguages)
        .catch(() => [])
        .finally(() => pendingRequests.delete(dataSourceId));
      pendingRequests.set(dataSourceId, languagesPromise);

      const languages = await languagesPromise;
      availableLanguagesByDataSource.set(dataSourceId, languages);
      return languages;
    },
    () => {
      availableLanguagesByDataSource.clear();
      pendingRequests.clear();
    },
  ];
})();

// visible for testing
export { clearCache };

/**
 * @returns observable list of query assist agent configured languages in the
 * selected data source.
 */
const getAvailableLanguages$ = (http: HttpSetup, data: DataPublicPluginSetup) =>
  data.query.queryString.getUpdates$().pipe(
    startWith(data.query.queryString.getQuery()),
    distinctUntilChanged(),
    switchMap(async (query) => {
      // currently query assist tool relies on opensearch API to get index
      // mappings, external data source types (e.g. s3) are not supported
      if (
        query.dataset?.dataSource?.type !== DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH && // datasource is MDS OpenSearch
        query.dataset?.dataSource?.type !== 'DATA_SOURCE' && // datasource is MDS OpenSearch when using indexes
        query.dataset?.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN // dataset is index pattern
      )
        return [];

      const dataSourceId = query.dataset?.dataSource?.id;
      return getAvailableLanguagesForDataSource(http, dataSourceId);
    })
  );

export const createQueryAssistExtension = (
  http: HttpSetup,
  data: DataPublicPluginSetup,
  config: ConfigSchema['queryAssist']
): QueryEditorExtensionConfig => {
  return {
    id: 'query-assist',
    order: 1000,
    getDataStructureMeta: async (dataSourceId) => {
      const isEnabled = await getAvailableLanguagesForDataSource(http, dataSourceId).then(
        (languages) => languages.length > 0
      );
      if (isEnabled) {
        return {
          type: DATA_STRUCTURE_META_TYPES.FEATURE,
          icon: { type: assistantMark },
          tooltip: i18n.translate('queryAssist.meta.icon.tooltip', {
            defaultMessage: 'Query assist is available',
          }),
        };
      }
    },
    isEnabled$: () =>
      getAvailableLanguages$(http, data).pipe(map((languages) => languages.length > 0)),
    getComponent: (dependencies) => {
      // only show the component if user is on a supported language.
      return (
        <QueryAssistWrapper dependencies={dependencies} http={http} data={data}>
          <QueryAssistBar dependencies={dependencies} />
        </QueryAssistWrapper>
      );
    },
    getBanner: (dependencies) => {
      // advertise query assist if user is not on a supported language.
      return (
        <QueryAssistWrapper dependencies={dependencies} http={http} data={data} invert>
          <QueryAssistBanner
            dependencies={dependencies}
            languages={config.supportedLanguages.map((conf) => conf.language)}
          />
        </QueryAssistWrapper>
      );
    },
  };
};

interface QueryAssistWrapperProps {
  dependencies: QueryEditorExtensionDependencies;
  http: HttpSetup;
  data: DataPublicPluginSetup;
  invert?: boolean;
}

const QueryAssistWrapper: React.FC<QueryAssistWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const subscription = getAvailableLanguages$(props.http, props.data).subscribe((languages) => {
      const available = languages.includes(props.dependencies.language);
      if (mounted) setVisible(props.invert ? !available : available);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [props]);

  if (!visible) return null;
  return <>{props.children}</>;
};
