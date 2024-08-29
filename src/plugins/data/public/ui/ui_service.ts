/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from 'src/core/public';
import { ConfigSchema } from '../../config';
import { DataPublicPluginStart } from '../types';
import { createIndexPatternSelect } from './index_pattern_select';
import { createSearchBar } from './search_bar/create_search_bar';
import { SuggestionsComponent } from './typeahead';
import { IUiSetup, IUiStart, SearchBarControl } from './types';
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
  searchBarControls$: BehaviorSubject<SearchBarControl[]> = new BehaviorSubject(
    [] as SearchBarControl[]
  );

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    const { enhancements } = initializerContext.config.get<ConfigSchema>();

    this.enhancementsConfig = enhancements;
  }

  addSearchBarControl = (control: SearchBarControl) => {
    this.searchBarControls$.next([...this.searchBarControls$.value, control]);
  };

  public setup(core: CoreSetup, {}: UiServiceSetupDependencies): IUiSetup {
    return {};
  }

  public start(core: CoreStart, { dataServices, storage }: UiServiceStartDependencies): IUiStart {
    const SearchBar = createSearchBar({
      core,
      data: dataServices,
      storage,
      searchBarControls$: this.searchBarControls$,
    });

    return {
      IndexPatternSelect: createIndexPatternSelect(core.savedObjects.client),
      SearchBar,
      SuggestionsComponent,
      addSearchBarControl: this.addSearchBarControl,
    };
  }

  public stop() {}
}
