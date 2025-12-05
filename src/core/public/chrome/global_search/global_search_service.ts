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
  ACTIONS: {
    description: i18n.translate('core.globalSearch.actions.description', {
      defaultMessage: 'Actions',
    }),
    alias: null,
  },
} as const;

export type SearchCommandKeyTypes = keyof typeof SearchCommandTypes;

/**
 * Options for the run method of GlobalSearchCommand
 * @experimental
 */
export interface GlobalSearchCommandRunOptions {
  /**
   * AbortSignal to cancel the search operation
   */
  abortSignal?: AbortSignal;
}

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
   * Defines the placeholder text displayed in the global search input field.
   * When multiple commands specify a placeholder, only the first registered command's placeholder will be used.
   *
   * @example 'Search pages, assets, and actions...'
   */
  inputPlaceholder?: string;

  /**
   * do the search and return search result with a React element
   * @param value search query
   * @param callback callback function when search is done
   * @param options options object containing abortSignal and other future extensible properties
   */
  run(
    value: string,
    callback?: () => void,
    options?: GlobalSearchCommandRunOptions
  ): Promise<ReactNode[]>;

  /**
   * Callback function executed when the user presses Enter in the global search bar.
   * This allows commands to perform custom actions based on the search query, such as navigation or triggering specific functionality.
   *
   * @param payload - The payload object containing the search content
   * @param payload.content - The search query string entered by the user
   *
   * @example
   * ```typescript
   * action: ({ content }) => {
   *   // Navigate to search results page
   *   window.location.href = `/search?q=${encodeURIComponent(content)}`;
   * }
   * ```
   */
  action?: (payload: { content: string }) => void;
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
   * Returns an observable stream of all registered search commands.
   * Subscribers will receive updates whenever search commands are added or removed.
   *
   * @returns An Observable that emits the current array of GlobalSearchCommand instances
   *
   * @example
   * ```typescript
   * chrome.globalSearch.getAllSearchCommands$().subscribe(commands => {
   *   console.log(`Available commands: ${commands.length}`);
   * });
   * ```
   */
  getAllSearchCommands$: () => Observable<GlobalSearchCommand[]>;
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
  private searchCommands$ = new BehaviorSubject<GlobalSearchCommand[]>([]);

  private get searchCommands() {
    return this.searchCommands$.getValue();
  }

  private registerSearchCommand(searchHandler: GlobalSearchCommand) {
    const exists = this.searchCommands.find((item) => {
      return item.id === searchHandler.id;
    });
    if (exists) {
      // eslint-disable-next-line no-console
      console.warn(`Duplicate SearchCommands id ${searchHandler.id} found`);
      return;
    }
    this.searchCommands$.next([...this.searchCommands, searchHandler]);
  }

  private unregisterSearchCommand(id: string) {
    this.searchCommands$.next(
      this.searchCommands.filter((item) => {
        return item.id !== id;
      })
    );
  }
  public setup(): GlobalSearchServiceSetupContract {
    return {
      registerSearchCommand: this.registerSearchCommand.bind(this),
    };
  }

  public start(): GlobalSearchServiceStartContract {
    return {
      getAllSearchCommands: () => this.searchCommands,
      unregisterSearchCommand: this.unregisterSearchCommand.bind(this),
      getAllSearchCommands$: () => this.searchCommands$.asObservable(),
      registerSearchCommand: this.registerSearchCommand.bind(this),
    };
  }
}
