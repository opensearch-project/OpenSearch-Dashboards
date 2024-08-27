/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { DEFAULT_DATA } from '../../../../data/common';
import {
  DataPublicPluginSetup,
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { API } from '../../../common';
import { ConfigSchema } from '../../../common/config';
import { QueryAssistBanner, QueryAssistBar } from '../components';

/**
 * @returns observable list of query assist agent configured languages in the
 * selected data source.
 */
const getAvailableLanguages$ = (
  availableLanguagesByDataSource: Map<string | undefined, string[]>,
  http: HttpSetup,
  data: DataPublicPluginSetup
) =>
  data.query.queryString.getUpdates$().pipe(
    startWith(data.query.queryString.getQuery()),
    distinctUntilChanged(),
    switchMap(async (query) => {
      // currently query assist tool relies on opensearch API to get index
      // mappings, external data source types (e.g. s3) are not supported
      if (query.dataset?.dataSource?.type !== DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH) return [];

      const dataSourceId = query.dataset?.dataSource?.id;
      const cached = availableLanguagesByDataSource.get(dataSourceId);
      if (cached !== undefined) return cached;
      const languages = await http
        .get<{ configuredLanguages: string[] }>(API.QUERY_ASSIST.LANGUAGES, {
          query: { dataSourceId },
        })
        .then((response) => response.configuredLanguages)
        .catch(() => []);
      availableLanguagesByDataSource.set(dataSourceId, languages);
      return languages;
    })
  );

export const createQueryAssistExtension = (
  http: HttpSetup,
  data: DataPublicPluginSetup,
  config: ConfigSchema['queryAssist']
): QueryEditorExtensionConfig => {
  const availableLanguagesByDataSource: Map<string | undefined, string[]> = new Map();

  return {
    id: 'query-assist',
    order: 1000,
    isEnabled$: () =>
      getAvailableLanguages$(availableLanguagesByDataSource, http, data).pipe(
        map((languages) => languages.length > 0)
      ),
    getComponent: (dependencies) => {
      // only show the component if user is on a supported language.
      return (
        <QueryAssistWrapper
          availableLanguagesByDataSource={availableLanguagesByDataSource}
          dependencies={dependencies}
          http={http}
          data={data}
        >
          <QueryAssistBar dependencies={dependencies} />
        </QueryAssistWrapper>
      );
    },
    getBanner: (dependencies) => {
      // advertise query assist if user is not on a supported language.
      return (
        <QueryAssistWrapper
          availableLanguagesByDataSource={availableLanguagesByDataSource}
          dependencies={dependencies}
          http={http}
          data={data}
          invert
        >
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
  availableLanguagesByDataSource: Map<string | undefined, string[]>;
  dependencies: QueryEditorExtensionDependencies;
  http: HttpSetup;
  data: DataPublicPluginSetup;
  invert?: boolean;
}

const QueryAssistWrapper: React.FC<QueryAssistWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const subscription = getAvailableLanguages$(
      props.availableLanguagesByDataSource,
      props.http,
      props.data
    ).subscribe((languages) => {
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
