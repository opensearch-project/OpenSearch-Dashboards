/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { LanguageConfig } from '../types';
import { ISearchInterceptor } from '../../../../search';

export const getDQLLanguageConfig = (
  search: ISearchInterceptor,
  defaultEditor: any
): LanguageConfig => {
  return {
    id: 'kuery',
    title: 'DQL',
    search,
    getQueryString(_) {
      return '';
    },
    editor: defaultEditor,
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    docLink: {
      title: i18n.translate('data.dqlLanguage.docLink', {
        defaultMessage: 'DQL documentation',
      }),
      url: 'https://opensearch.org/docs/latest/query-dsl/full-text/query-string/',
    },
    editorSupportedAppNames: ['discover'],
    supportedAppNames: ['discover', 'dashboards', 'visualize', 'data-explorer', 'vis-builder', '*'],
    sampleQueries: [
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.titleContainsWind', {
          defaultMessage: 'The title field contains the word wind.',
        }),
        query: 'title: wind',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.titleContainsWindOrWindy', {
          defaultMessage: 'The title field contains the word wind or the word windy.',
        }),
        query: 'title: (wind OR windy)',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.titleContainsPhraseWindRises', {
          defaultMessage: 'The title field contains the phrase wind rises.',
        }),
        query: 'title: "wind rises"',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.titleKeywordExactMatch', {
          defaultMessage: 'The title.keyword field exactly matches The wind rises.',
        }),
        query: 'title.keyword: The wind rises',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.titleFieldsContainWind', {
          defaultMessage:
            'Any field that starts with title (for example, title and title.keyword) contains the word wind',
        }),
        query: 'title*: wind',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.articleTitleContainsWind', {
          defaultMessage:
            'The field that starts with article and ends with title contains the word wind. Matches the field article title.',
        }),
        query: 'article*title: wind',
      },
      {
        title: i18n.translate('data.dqlLanguage.sampleQuery.descriptionFieldExists', {
          defaultMessage: 'Documents in which the field description exists.',
        }),
        query: 'description:*',
      },
    ],
  };
};
