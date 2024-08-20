/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from 'src/core/public';
import { ConfigSchema } from '../../config';
import { DataPublicPluginStart } from '../types';
import { createDataSetNavigator } from './dataset_navigator';
import { createIndexPatternSelect } from './index_pattern_select';
import { QueryEditorExtensionConfig } from './query_editor';
import { createSearchBar } from './search_bar/create_search_bar';
import { createSettings } from './settings';
import { SuggestionsComponent } from './typeahead';
import { IUiSetup, IUiStart, QueryEnhancement, UiEnhancements } from './types';
import { DataStorage } from '../../common';

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UiServiceSetupDependencies {}

/** @internal */
export interface UiServiceStartDependencies {
  dataServices: Omit<DataPublicPluginStart, 'ui'>;
  storage: DataStorage;
}

export class UiService implements Plugin<IUiSetup, IUiStart> {
  enhancementsConfig: ConfigSchema['enhancements'];
  private queryEnhancements: Map<string, QueryEnhancement> = new Map();
  private queryEditorExtensionMap: Record<string, QueryEditorExtensionConfig> = {};
  private dataSetContainer$ = new BehaviorSubject<HTMLDivElement | null>(null);

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    const { enhancements } = initializerContext.config.get<ConfigSchema>();

    this.enhancementsConfig = enhancements;
  }

  public setup(core: CoreSetup, {}: UiServiceSetupDependencies): IUiSetup {
    return {
      __enhance: (enhancements?: UiEnhancements) => {
        if (!enhancements) return;
        if (enhancements.query && enhancements.query.language) {
          this.queryEnhancements.set(enhancements.query.language, enhancements.query);
        }
        if (enhancements.queryEditorExtension) {
          this.queryEditorExtensionMap[enhancements.queryEditorExtension.id] =
            enhancements.queryEditorExtension;
        }
      },
    };
  }

  public start(core: CoreStart, { dataServices, storage }: UiServiceStartDependencies): IUiStart {
    const Settings = createSettings({
      config: this.enhancementsConfig,
      search: dataServices.search,
      storage,
      queryEnhancements: this.queryEnhancements,
      queryEditorExtensionMap: this.queryEditorExtensionMap,
    });

    const setDataSetContainerRef = (ref: HTMLDivElement | null) => {
      this.dataSetContainer$.next(ref);
    };

    const SearchBar = createSearchBar({
      core,
      data: dataServices,
      storage,
      settings: Settings,
      setDataSetContainerRef,
    });

    return {
      IndexPatternSelect: createIndexPatternSelect(core.savedObjects.client),
      DataSetNavigator: createDataSetNavigator(
        core.savedObjects.client,
        core.http,
        dataServices.query.dataSetManager
      ),
      SearchBar,
      SuggestionsComponent,
      Settings,
      dataSetContainer$: this.dataSetContainer$,
    };
  }

  public stop() {}
}
