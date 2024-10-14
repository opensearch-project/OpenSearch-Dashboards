/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { i18n } from '@osd/i18n';

/**
 * search input match with `@` will handled by saved objects search command
 * search input match with `>` will handled by plugin customized commands
 */
export const SAVED_OBJECTS_SYMBOL = '@';
export const COMMANDS_SYMBOL = '>';

export const SearchCommandTypes = {
  PAGES: {
    description: i18n.translate('core.globalSearch.pages.description', { defaultMessage: 'Pages' }),
    alias: null,
  },
  SAVED_OBJECTS: {
    description: i18n.translate('core.globalSearch.assets.description', {
      defaultMessage: 'Assets',
    }),
    alias: SAVED_OBJECTS_SYMBOL,
  },
} as const;

export type SearchCommandKeyTypes = keyof typeof SearchCommandTypes;

/**
 * @experimental
 */
export interface GlobalSearchCommand {
  /**
   * unique id of this command
   */
  id: string;
  /**
   * search command type
   * @type {SearchCommandTypes}
   */
  type: SearchCommandKeyTypes;
  /**
   * do the search and return search result with a React element
   * @param value search query
   * @param callback callback function when search is done
   */
  run(value: string, callback?: () => void): Promise<ReactNode[]>;
}

export interface GlobalSearchServiceSetupContract {
  registerSearchCommand(searchCommand: GlobalSearchCommand): void;
}

export interface GlobalSearchServiceStartContract {
  getAllSearchCommands(): GlobalSearchCommand[];
}

/**
 * {@link GlobalSearchCommand | APIs} for registering new global search command when do search from header search bar .
 *
 * @example
 * Register a GlobalSearchCommand to search pages
 * ```jsx
 * chrome.globalSearch.registerSearchCommand({
 *   id: 'test',
 *   type: SearchObjectTypes.PAGES,
 *   run: async (query) => {
 *     return [];
 *   },
 * })
 * ```
 *
 * @experimental
 */
export class GlobalSearchService {
  private searchCommands = [] as GlobalSearchCommand[];

  private registerSearchCommand(searchHandler: GlobalSearchCommand) {
    const exists = this.searchCommands.find((item) => {
      return item.id === searchHandler.id;
    });
    if (exists) {
      // eslint-disable-next-line no-console
      console.warn(`Duplicate SearchCommands id ${searchHandler.id} found`);
      return;
    }
    this.searchCommands.push(searchHandler);
  }

  public setup(): GlobalSearchServiceSetupContract {
    return {
      registerSearchCommand: this.registerSearchCommand.bind(this),
    };
  }

  public start(): GlobalSearchServiceStartContract {
    return {
      getAllSearchCommands: () => this.searchCommands,
    };
  }
}
