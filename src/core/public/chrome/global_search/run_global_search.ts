/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GlobalSearchCommand,
  GlobalSearchCommandRunOptions,
  GlobalSearchResult,
  SearchCommandKeyTypes,
  SearchCommandTypes,
} from './global_search_service';

export interface GlobalSearchResultWithCommand {
  commandId: string;
  result: GlobalSearchResult;
}

export interface GlobalSearchResultGroup {
  type: SearchCommandKeyTypes;
  label: string;
  results: GlobalSearchResultWithCommand[];
}

interface RunGlobalSearchOptions extends GlobalSearchCommandRunOptions {
  commands: GlobalSearchCommand[];
  value: string;
}

const SEARCH_COMMAND_TYPE_ORDER: SearchCommandKeyTypes[] = ['PAGES', 'SAVED_OBJECTS', 'ACTIONS'];

const getCommandsForValue = (commands: GlobalSearchCommand[], value: string) => {
  const actionCommands = commands.filter((command) => command.type === 'ACTIONS');
  const searchCommands = commands.filter((command) => command.type !== 'ACTIONS');
  const aliasCommands = searchCommands.filter((command) => {
    const alias = SearchCommandTypes[command.type].alias;
    return alias && value.startsWith(alias);
  });
  const defaultCommands = searchCommands.filter(
    (command) => !SearchCommandTypes[command.type].alias
  );

  return [...(aliasCommands.length ? aliasCommands : defaultCommands), ...actionCommands];
};

export const runGlobalSearch = async ({
  commands,
  value,
  abortSignal,
}: RunGlobalSearchOptions): Promise<GlobalSearchResultGroup[]> => {
  if (!value) {
    return [];
  }

  const selectedCommands = getCommandsForValue(commands, value);
  const settledResults = await Promise.allSettled(
    selectedCommands.map((command) => {
      const alias = SearchCommandTypes[command.type].alias;
      const query = alias && value.startsWith(alias) ? value.slice(alias.length).trim() : value;
      return command.run(query, { abortSignal });
    })
  );

  const resultsByType = new Map<SearchCommandKeyTypes, GlobalSearchResultWithCommand[]>();

  settledResults.forEach((settledResult, index) => {
    if (settledResult.status !== 'fulfilled') {
      return;
    }

    const command = selectedCommands[index];
    const currentResults = resultsByType.get(command.type) ?? [];
    resultsByType.set(command.type, [
      ...currentResults,
      ...settledResult.value.map((result) => ({ commandId: command.id, result })),
    ]);
  });

  return SEARCH_COMMAND_TYPE_ORDER.filter((type) => resultsByType.has(type)).map((type) => ({
    type,
    label: SearchCommandTypes[type].description,
    results: resultsByType.get(type) ?? [],
  }));
};
