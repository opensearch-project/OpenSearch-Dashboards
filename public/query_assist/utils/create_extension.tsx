/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import React, { useEffect, useState } from 'react';
import { getMdsDataSourceId } from '.';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { API } from '../../../common';
import { PublicConfig } from '../../plugin';
import { getData } from '../../services';
import { QueryAssistBar } from '../components';
import { QueryAssistBanner } from '../components/query_assist_banner';

let availableLanguagesByDataSource: Map<string | undefined, string[]>;

/**
 * @param dependencies - QueryEditorExtensionDependencies.
 * @param http - HttpSetup.
 * @returns list of query assist agents configured languages in the data source
 * associated with the currently selected index pattern.
 */
const getAvailableLanguages = async (
  dependencies: QueryEditorExtensionDependencies,
  http: HttpSetup
) => {
  if (!availableLanguagesByDataSource) availableLanguagesByDataSource = new Map();

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
  config: PublicConfig
): QueryEditorExtensionConfig => {
  return {
    id: 'query-assist',
    order: 1000,
    isEnabled: async (dependencies) => {
      // currently query assist tool relies on opensearch API to get index
      // mappings, non-default data source types are not supported
      if (dependencies.dataSource && dependencies.dataSource?.getType() !== 'default') return false;

      const languages = await getAvailableLanguages(dependencies, http);
      return languages.length > 0;
    },
    getComponent: (dependencies) => {
      // only show the component if user is on a supported language.
      return (
        <QueryAssistWrapper dependencies={dependencies} http={http}>
          <QueryAssistBar dependencies={dependencies} />
        </QueryAssistWrapper>
      );
    },
    getBanner: (dependencies) => {
      // advertise query assist if user is not on a supported language.
      return (
        <QueryAssistWrapper dependencies={dependencies} http={http} invert>
          <QueryAssistBanner
            languages={config.queryAssist.supportedLanguages.map((conf) => conf.language)}
          />
        </QueryAssistWrapper>
      );
    },
  };
};

interface QueryAssistWrapperProps {
  dependencies: QueryEditorExtensionDependencies;
  http: HttpSetup;
  invert?: boolean;
}

const QueryAssistWrapper: React.FC<QueryAssistWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const available = (await getAvailableLanguages(props.dependencies, props.http)).includes(
        props.dependencies.language
      );
      if (mounted) setVisible(props.invert ? !available : available);
    })();

    return () => {
      mounted = false;
    };
  }, [props]);

  if (!visible) return null;
  return <>{props.children}</>;
};
