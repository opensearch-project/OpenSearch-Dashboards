/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { getMdsDataSourceId } from '.';
import {
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from '../../../../data/public';
import { API } from '../../../common';
import { ConfigSchema } from '../../../common/config';
import { getData } from '../../services';
import { QueryAssistBanner, QueryAssistBar } from '../components';

/**
 * @param dependencies - QueryEditorExtensionDependencies.
 * @param http - HttpSetup.
 * @returns list of query assist agents configured languages in the data source
 * associated with the currently selected index pattern.
 */
const getAvailableLanguages = async (
  availableLanguagesByDataSource: Map<string | undefined, string[]>,
  dependencies: QueryEditorExtensionDependencies,
  http: HttpSetup
) => {
  const dataSourceId = await getMdsDataSourceId(
    getData().indexPatterns,
    dependencies.indexPatterns?.at(0)
  );
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
};

export const createQueryAssistExtension = (
  http: HttpSetup,
  config: ConfigSchema['queryAssist']
): QueryEditorExtensionConfig => {
  const availableLanguagesByDataSource: Map<string | undefined, string[]> = new Map();

  return {
    id: 'query-assist',
    order: 1000,
    isEnabled$: (dependencies) => {
      // currently query assist tool relies on opensearch API to get index
      // mappings, non-default data source types are not supported
      if (dependencies.dataSource && dependencies.dataSource?.getType() !== 'default')
        return of(false);

      return from(getAvailableLanguages(availableLanguagesByDataSource, dependencies, http)).pipe(
        map((languages) => languages.length > 0)
      );
    },
    getComponent: (dependencies) => {
      // only show the component if user is on a supported language.
      return (
        <QueryAssistWrapper
          availableLanguagesByDataSource={availableLanguagesByDataSource}
          dependencies={dependencies}
          http={http}
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
          invert
        >
          <QueryAssistBanner languages={config.supportedLanguages.map((conf) => conf.language)} />
        </QueryAssistWrapper>
      );
    },
  };
};

interface QueryAssistWrapperProps {
  availableLanguagesByDataSource: Map<string | undefined, string[]>;
  dependencies: QueryEditorExtensionDependencies;
  http: HttpSetup;
  invert?: boolean;
}

const QueryAssistWrapper: React.FC<QueryAssistWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const available = (
        await getAvailableLanguages(
          props.availableLanguagesByDataSource,
          props.dependencies,
          props.http
        )
      ).includes(props.dependencies.language);
      if (mounted) setVisible(props.invert ? !available : available);
    })();

    return () => {
      mounted = false;
    };
  }, [props]);

  if (!visible) return null;
  return <>{props.children}</>;
};
