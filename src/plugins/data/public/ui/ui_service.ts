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
import { createSearchBar } from './search_bar/create_search_bar';
import { SuggestionsComponent } from './typeahead';
import { IUiSetup, IUiStart } from './types';
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
  private dataSetContainer$ = new BehaviorSubject<HTMLDivElement | null>(null);

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    const { enhancements } = initializerContext.config.get<ConfigSchema>();

    this.enhancementsConfig = enhancements;
  }

  public setup(core: CoreSetup, {}: UiServiceSetupDependencies): any {}

  public start(core: CoreStart, { dataServices, storage }: UiServiceStartDependencies): IUiStart {
    const setDataSetContainerRef = (ref: HTMLDivElement | null) => {
      this.dataSetContainer$.next(ref);
    };

    const SearchBar = createSearchBar({
      core,
      data: dataServices,
      storage,
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
      dataSetContainer$: this.dataSetContainer$,
    };
  }

  public stop() {}
}
