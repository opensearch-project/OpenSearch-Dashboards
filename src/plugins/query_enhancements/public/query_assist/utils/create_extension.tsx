/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { DATA_STRUCTURE_META_TYPES, DEFAULT_DATA } from '../../../../data/common';
import {
  DataPublicPluginSetup,
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { API } from '../../../common';
import { ConfigSchema } from '../../../common/config';
import assistantMark from '../../assets/sparkle_mark.svg';
import { QueryAssistBanner, QueryAssistBar, QueryAssistSummary } from '../components';
import { UsageCollectionSetup } from '../../../../usage_collection/public';
import { QueryAssistContext } from '../hooks/use_query_assist';
import { CoreSetup } from '../../../../../core/public';

const [getAvailableLanguagesForDataSource, clearCache] = (() => {
  const availableLanguagesByDataSource: Map<string | undefined, string[]> = new Map();
  const pendingRequests: Map<string | undefined, Promise<string[]>> = new Map();

  return [
    async (http: HttpSetup, dataSourceId: string | undefined, timeout?: number) => {
      const cached = availableLanguagesByDataSource.get(dataSourceId);
      if (cached !== undefined) return cached;

      const pendingRequest = pendingRequests.get(dataSourceId);
      if (pendingRequest !== undefined) return pendingRequest;

      const controller = timeout ? new AbortController() : undefined;
      const timeoutId = timeout ? setTimeout(() => controller?.abort(), timeout) : undefined;

      const languagesPromise = http
        .get<{ configuredLanguages: string[] }>(API.QUERY_ASSIST.LANGUAGES, {
          query: { dataSourceId },
          signal: controller?.signal,
        })
        .then((response) => response.configuredLanguages)
        .catch(() => [])
        .finally(() => {
          pendingRequests.delete(dataSourceId);
          if (timeoutId) clearTimeout(timeoutId);
        });

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
  core: CoreSetup,
  data: DataPublicPluginSetup,
  config: ConfigSchema['queryAssist'],
  isQuerySummaryCollapsed$: BehaviorSubject<boolean>,
  resultSummaryEnabled$: BehaviorSubject<boolean>,
  usageCollection?: UsageCollectionSetup
): QueryEditorExtensionConfig => {
  const http: HttpSetup = core.http;
  const question$ = new BehaviorSubject('');
  return {
    id: 'query-assist',
    order: 1000,
    getDataStructureMeta: async (dataSourceId) => {
      // [TODO] - The timmeout exists because the loading of the Datasource menu is prevented until this request completes. This if a single cluster is down the request holds the whole menu level in a loading state. We should make this call non blocking and load the datasource meta in the background.
      const isEnabled = await getAvailableLanguagesForDataSource(http, dataSourceId, 3000) // 3s timeout for quick check
        .then((languages) => languages.length > 0);
      if (isEnabled) {
        return {
          type: DATA_STRUCTURE_META_TYPES.FEATURE,
          icon: { type: assistantMark },
          tooltip: i18n.translate('queryEnhancements.meta.icon.tooltip', {
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
        <QueryAssistWrapper
          dependencies={dependencies}
          http={http}
          data={data}
          isQuerySummaryCollapsed$={isQuerySummaryCollapsed$}
          {...(config.summary.enabled && { resultSummaryEnabled$ })}
          question$={question$}
        >
          <QueryAssistBar dependencies={dependencies} />
          {config.summary.enabled && (
            <QueryAssistSummary
              data={data}
              http={http}
              usageCollection={usageCollection}
              dependencies={dependencies}
              core={core}
            />
          )}
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
  isQuerySummaryCollapsed$?: BehaviorSubject<boolean>;
  resultSummaryEnabled$?: BehaviorSubject<boolean>;
  question$?: BehaviorSubject<string>;
}

const QueryAssistWrapper: React.FC<QueryAssistWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [isQuerySummaryCollapsed, setIsQuerySummaryCollapsed] = useState(true);
  const updateQuestion = (newQuestion: string) => {
    props.question$?.next(newQuestion);
  };
  const question$ = props.question$;

  useEffect(() => {
    const subscription = props.isQuerySummaryCollapsed$?.subscribe((isCollapsed) => {
      setIsQuerySummaryCollapsed(isCollapsed);
    });
    const questionSubscription = props.question$?.subscribe((newQuestion) => {
      setQuestion(newQuestion);
    });

    return () => {
      questionSubscription?.unsubscribe();
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    const subscription = getAvailableLanguages$(props.http, props.data).subscribe((languages) => {
      const available = languages.includes(props.dependencies.language);
      if (mounted) {
        const isVisible = props.invert ? !available : available;
        setVisible(isVisible);
        props.resultSummaryEnabled$?.next(isVisible);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [props]);

  if (!visible) return null;
  return (
    <>
      <QueryAssistContext.Provider
        value={{
          question,
          question$,
          updateQuestion,
          isQuerySummaryCollapsed,
        }}
      >
        {props.children}
      </QueryAssistContext.Provider>
    </>
  );
};
