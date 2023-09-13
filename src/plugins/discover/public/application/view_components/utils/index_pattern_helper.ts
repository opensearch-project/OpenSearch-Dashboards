/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SearchSource, IndexPattern } from 'src/plugins/data/public';
import { SavedObject, ToastsStart } from 'opensearch-dashboards/public';
import { redirectWhenMissing, getUrlTracker } from '../../../opensearch_dashboards_services';
import { getIndexPatternId } from '../../helpers/get_index_pattern_id';

export type IndexPatternSavedObject = SavedObject & { title: string };
export interface IndexPatternData {
  loaded: IndexPattern;
  stateVal: string;
  stateValFound: boolean;
}

export const fetchIndexPattern = async (data, config) => {
  await data.indexPatterns.ensureDefaultIndexPattern();
  const indexPatternList = await data.indexPatterns.getCache();
  const id = getIndexPatternId('', indexPatternList, config.get('defaultIndex'));
  const indexPatternData = await data.indexPatterns.get(id);
  const ip: IndexPatternData = {
    loaded: indexPatternData,
    stateVal: '', // TODO: get stateVal from appStateContainer
    stateValFound: false, // TODO: get stateValFound from appStateContainer
  };
  return ip;
};

export const fetchSavedSearch = async (
  core,
  basePath,
  history,
  savedSearchId,
  services,
  toastNotifications
) => {
  try {
    const savedSearch = await services.getSavedSearchById(savedSearchId);
    return savedSearch;
  } catch (error) {
    // TODO: handle redirect with Data Explorer
    redirectWhenMissing({
      history,
      navigateToApp: core.application.navigateToApp,
      basePath,
      mapping: {
        search: '/',
        'index-pattern': {
          app: 'management',
          path: `opensearch-dashboards/objects/savedSearches/${savedSearchId}`,
        },
      },
      toastNotifications,
      onBeforeRedirect() {
        getUrlTracker().setTrackedUrl('/');
      },
    });
  }
};

export function resolveIndexPattern(
  ip: IndexPatternData,
  searchSource: SearchSource,
  toastNotifications: ToastsStart
) {
  const { loaded: loadedIndexPattern, stateVal, stateValFound } = ip;

  const ownIndexPattern = searchSource.getOwnField('index');

  if (ownIndexPattern && !stateVal) {
    return ownIndexPattern;
  }

  if (stateVal && !stateValFound) {
    const warningTitle = i18n.translate('discover.valueIsNotConfiguredIndexPatternIDWarningTitle', {
      defaultMessage: '{id} is not a configured index pattern ID',
      values: {
        id: `"${stateVal}"`,
      },
    });

    if (ownIndexPattern) {
      toastNotifications.addWarning({
        title: warningTitle,
        text: i18n.translate('discover.showingSavedIndexPatternWarningDescription', {
          defaultMessage:
            'Showing the saved index pattern: "{ownIndexPatternTitle}" ({ownIndexPatternId})',
          values: {
            ownIndexPatternTitle: ownIndexPattern.title,
            ownIndexPatternId: ownIndexPattern.id,
          },
        }),
      });
      return ownIndexPattern;
    }

    toastNotifications.addWarning({
      title: warningTitle,
      text: i18n.translate('discover.showingDefaultIndexPatternWarningDescription', {
        defaultMessage:
          'Showing the default index pattern: "{loadedIndexPatternTitle}" ({loadedIndexPatternId})',
        values: {
          loadedIndexPatternTitle: loadedIndexPattern.title,
          loadedIndexPatternId: loadedIndexPattern.id,
        },
      }),
    });
  }

  return loadedIndexPattern;
}
