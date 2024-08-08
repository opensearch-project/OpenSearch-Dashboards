/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  IndexPattern,
  SIMPLE_DATA_SET_TYPES,
  SimpleDataSet,
  SimpleDataSource,
  UI_SETTINGS,
} from '../../../common';
import { IndexPatternsContract } from '../../index_patterns';
import { QueryEnhancement, UiEnhancements } from '../../ui/types';
import { QueryEditorExtensionConfig } from '../../ui';
import { DataPublicPluginEnhancements } from '../../types';

export class LanguageManager {
  private queryEnhancements$: BehaviorSubject<Map<string, QueryEnhancement>>;
  private queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig>;
  //TODO
  //private queryEditorUISettings: Map<string, queryEditorUISettings>;

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.queryEnhancements$ = new BehaviorSubject<Map<string, QueryEnhancement>>({} as any);
    this.queryEditorExtensionMap = {};
    //TODO
    //this.queryEditorUISettings = new Map();
  }

  public __enhance = (enhancements: UiEnhancements) => {
    if (!enhancements) return;
    if (enhancements.query && enhancements.query.language) {
      const map = new Map<string, QueryEnhancement>();
      map.set(enhancements.query.language, enhancements.query);
      this.queryEnhancements$.next(map);
    }
    if (enhancements.queryEditorExtension) {
      this.queryEditorExtensionMap[enhancements.queryEditorExtension.id] =
        enhancements.queryEditorExtension;
    }

    //TODO
    //settings related to query editor UI
    // if (enhancements.queryEditorUISettings && enhancements.queryEditorUISettings.language) {
    //   this.queryEditorUISettings.set(
    //     enhancements.queryEditorUISettings.language,
    //     enhancements.queryEditorUISettings
    //   );
    // }
  };

  //   public initWithIndexPattern = (indexPattern: IndexPattern | null) => {
  //     if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
  //     if (!indexPattern || !indexPattern.id) {
  //       return undefined;
  //     }

  //     this.defaultDataSet = {
  //       id: indexPattern.id,
  //       title: indexPattern.title,
  //       type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
  //       timeFieldName: indexPattern.timeFieldName,
  //       fields: indexPattern.fields,
  //       ...(indexPattern.dataSourceRef
  //         ? {
  //             dataSourceRef: {
  //               id: indexPattern.dataSourceRef?.id,
  //               name: indexPattern.dataSourceRef?.name,
  //               type: indexPattern.dataSourceRef?.type,
  //             } as SimpleDataSource,
  //           }
  //         : {}),
  //     };
  //   };

  //   public getUpdates$ = () => {
  //     return this.dataSet$.asObservable().pipe(skip(1));
  //   };

  public getQueryEnhancement = () => {
    return this.queryEnhancements$.getValue();
  };

  public getUpdates$ = () => {
    return this.queryEnhancements$.asObservable().pipe(skip(1));
  };

  public getQueryEditorExtension = () => {
    return this.queryEditorExtensionMap;
  };

  //   public getDefaultDataSet = () => {
  //     return this.defaultDataSet;
  //   };

  //   public fetchDefaultDataSet = async (): Promise<SimpleDataSet | undefined> => {
  //     const defaultIndexPatternId = this.uiSettings.get('defaultIndex');
  //     if (!defaultIndexPatternId) {
  //       return undefined;
  //     }

  //     const indexPattern = await this.indexPatterns?.get(defaultIndexPatternId);
  //     if (!indexPattern || !indexPattern.id) {
  //       return undefined;
  //     }

  //     return {
  //       id: indexPattern.id,
  //       title: indexPattern.title,
  //       type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
  //       timeFieldName: indexPattern.timeFieldName,
  //       ...(indexPattern.dataSourceRef
  //         ? {
  //             dataSourceRef: {
  //               id: indexPattern.dataSourceRef?.id,
  //               name: indexPattern.dataSourceRef?.name,
  //               type: indexPattern.dataSourceRef?.type,
  //             } as SimpleDataSource,
  //           }
  //         : {}),
  //     };
  //   };
}

export type LanguageContract = PublicMethodsOf<LanguageManager>;
