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

/**
 * Setup contract for the global search service.
 * Provides methods to register search commands and submit commands during the setup lifecycle.
 * @experimental
 */
export interface GlobalSearchServiceSetupContract {
  /**
   * Registers a search command that will be executed when users perform searches in the global search bar.
   * Each command must have a unique ID and will be invoked based on the search query pattern.
   *
   * @param searchCommand - The search command to register
   * @throws Warning if a command with the same ID already exists
   *
   * @example
   * ```typescript
   * chrome.globalSearch.registerSearchCommand({
   *   id: 'my-search-command',
   *   type: 'PAGES',
   *   run: async (query, callback, abortSignal) => {
   *     // Perform search logic
   *     return [<SearchResult key="1">Result 1</SearchResult>];
   *   }
   * });
   * ```
   */
  registerSearchCommand(searchCommand: GlobalSearchCommand): void;

  /**
   * Registers a submit command that will be available when users submit content from the global search bar.
   * Submit commands allow plugins to handle user submissions with custom actions.
   *
   * @param searchResultCommand - The submit command to register
   * @throws Warning if a command with the same ID already exists
   *
   * @example
   * ```typescript
   * chrome.globalSearch.registerSearchSubmitCommand({
   *   id: 'my-submit-command',
   *   name: 'Create New Item',
   *   run: (payload) => {
   *     // Handle the submitted content
   *     console.log('User submitted:', payload.content);
   *   }
   * });
   * ```
   */
  registerSearchSubmitCommand(searchResultCommand: GlobalSearchSubmitCommand): void;
}

/**
 * Start contract for the global search service.
 * Provides methods to retrieve and manage search commands during the start lifecycle.
 * @experimental
 */
export interface GlobalSearchServiceStartContract {
  /**
   * Retrieves all registered search commands.
   * Returns an array of all search commands that have been registered during the setup phase.
   *
   * @returns An array of all registered GlobalSearchCommand instances
   *
   * @example
   * ```typescript
   * const commands = chrome.globalSearch.getAllSearchCommands();
   * console.log(`Total commands: ${commands.length}`);
   * ```
   */
  getAllSearchCommands(): GlobalSearchCommand[];

  /**
   * Unregisters a previously registered search command by its ID.
   * This removes the command from the list of available search commands.
   *
   * @param id - The unique identifier of the search command to unregister
   *
   * @example
   * ```typescript
   * chrome.globalSearch.unregisterSearchCommand('my-search-command');
   * ```
   */
  unregisterSearchCommand(id: string): void;

  /**
   * Unregisters a previously registered submit command by its ID.
   * This removes the command from the list of available submit commands.
   *
   * @param id - The unique identifier of the submit command to unregister
   *
   * @example
   * ```typescript
   * chrome.globalSearch.unregisterSearchSubmitCommand('my-submit-command');
   * ```
   */
  unregisterSearchSubmitCommand(id: string): void;

  /**
   * Returns an observable stream of all registered submit commands.
   * Subscribers will receive updates whenever submit commands are added or removed.
   *
   * @returns An Observable that emits the current array of GlobalSearchSubmitCommand instances
   *
   * @example
   * ```typescript
   * chrome.globalSearch.getSearchSubmitCommands$().subscribe(commands => {
   *   console.log(`Available submit commands: ${commands.length}`);
   * });
   * ```
   */
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
      unregisterSearchSubmitCommand: this.unregisterSearchSubmitCommand.bind(this),
    };
  }
}
