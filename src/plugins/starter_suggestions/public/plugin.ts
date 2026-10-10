/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plugin } from '../../../core/public';
import { StarterSuggestionsService } from './services';
import { StarterSuggestionsPluginSetup, StarterSuggestionsPluginStart } from './types';

/**
 * Registry of starter suggestion providers. Owns no UI and depends on no other
 * plugin, so a page plugin can contribute suggestions without depending on
 * whichever plugin renders them.
 */
export class StarterSuggestionsPlugin implements Plugin<
  StarterSuggestionsPluginSetup,
  StarterSuggestionsPluginStart
> {
  private readonly service = new StarterSuggestionsService();

  public setup(): StarterSuggestionsPluginSetup {
    return {
      registerProvider: (provider) => this.service.registerProvider(provider),
    };
  }

  public start(): StarterSuggestionsPluginStart {
    return this.service;
  }

  public stop() {
    this.service.clear();
  }
}
