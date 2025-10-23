/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { i18n } from '@osd/i18n';
import { BehaviorSubject, Observable } from 'rxjs';

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
  run(value: string, callback?: () => void, abortSignal?: AbortSignal): Promise<ReactNode[]>;
}

/**
 * @experimental
 */
export interface GlobalSearchSubmitCommand {
  id: string;
  name: string;
  run: (payload: { content: string }) => void;
}

export interface GlobalSearchServiceSetupContract {
  registerSearchCommand(searchCommand: GlobalSearchCommand): void;
  registerSearchSubmitCommand(searchResultCommand: GlobalSearchSubmitCommand): void;
}

export interface GlobalSearchServiceStartContract {
  getAllSearchCommands(): GlobalSearchCommand[];
  unregisterSearchCommand(id: string): void;
  unregisterSearchSubmitCommand(id: string): void;
  getSearchSubmitCommands$: () => Observable<GlobalSearchSubmitCommand[]>;
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
  private searchCommands: GlobalSearchCommand[] = [];
  private searchSubmitCommands$ = new BehaviorSubject<GlobalSearchSubmitCommand[]>([]);

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

  private unregisterSearchCommand(id: string) {
    this.searchCommands = this.searchCommands.filter((item) => {
      return item.id !== id;
    });
  }

  private registerSearchSubmitCommand = (searchSubmitCommand: GlobalSearchSubmitCommand) => {
    const commands = this.searchSubmitCommands$.getValue();
    if (commands.find((command) => command.id === searchSubmitCommand.id)) {
      // eslint-disable-next-line no-console
      console.warn(`Duplicate SearchSubmitCommands id ${searchSubmitCommand.id} found`);
      return;
    }
    this.searchSubmitCommands$.next([...commands, searchSubmitCommand]);
  };

  private unregisterSearchSubmitCommand(id: string) {
    const newCommands = this.searchSubmitCommands$.getValue().filter((item) => {
      return item.id !== id;
    });
    if (newCommands.length === this.searchSubmitCommands$.getValue().length) {
      return;
    }
    this.searchSubmitCommands$.next(newCommands);
  }

  public setup(): GlobalSearchServiceSetupContract {
    return {
      registerSearchCommand: this.registerSearchCommand.bind(this),
      registerSearchSubmitCommand: this.registerSearchSubmitCommand,
    };
  }

  public start(): GlobalSearchServiceStartContract {
    return {
      getAllSearchCommands: () => this.searchCommands,
      getSearchSubmitCommands$: () => this.searchSubmitCommands$.asObservable(),
      unregisterSearchCommand: this.unregisterSearchCommand.bind(this),
      unregisterSearchSubmitCommand: this.unregisterSearchSubmitCommand,
    };
  }
}
