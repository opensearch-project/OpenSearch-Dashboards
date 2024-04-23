/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin, CoreSetup, CoreStart, PluginInitializerContext } from 'src/core/public';
import { DataPublicPluginStartUi, QueryEnhancement, UiEnhancements } from './types';

import { ConfigSchema } from '../../config';
import { createIndexPatternSelect } from './index_pattern_select';
import { createSearchBar } from './search_bar/create_search_bar';
import { createSettings } from './settings';
import { DataPublicPluginStart } from '../types';
import { IStorageWrapper } from '../../../opensearch_dashboards_utils/public';

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UiServiceSetupDependencies {}

/** @internal */
export interface UiServiceStartDependencies {
  dataServices: Omit<DataPublicPluginStart, 'ui'>;
  storage: IStorageWrapper;
}

export class UiService implements Plugin<any, DataPublicPluginStartUi> {
  enhancementsConfig: ConfigSchema['enhancements'];
  private queryEnhancements: Map<string, QueryEnhancement> = new Map();

  constructor(initializerContext: PluginInitializerContext<ConfigSchema>) {
    const { enhancements } = initializerContext.config.get<ConfigSchema>();

    this.enhancementsConfig = enhancements;
  }

  public setup(core: CoreSetup, {}: UiServiceSetupDependencies) {
    return {
      __enhance: (enhancements?: UiEnhancements) => {
        if (!enhancements) return;
        if (!this.enhancementsConfig.enabled) return;
        if (enhancements.query && enhancements.query.language) {
          this.queryEnhancements.set(enhancements.query.language, enhancements.query);
        }
      },
    };
  }

  public start(core: CoreStart, { dataServices, storage }: UiServiceStartDependencies) {
    const Settings = createSettings({ storage, queryEnhancements: this.queryEnhancements });

    const SearchBar = createSearchBar({
      core,
      data: dataServices,
      storage,
      queryEnhancements: this.queryEnhancements,
      settings: Settings,
    });

    return {
      queryEnhancements: this.queryEnhancements,
      IndexPatternSelect: createIndexPatternSelect(core.savedObjects.client),
      SearchBar,
      Settings,
    };
  }

  public stop() {}
}
