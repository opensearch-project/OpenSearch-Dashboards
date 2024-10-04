/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  dedupCmd,
  evalCmd,
  fieldsCmd,
  headCmd,
  parseCmd,
  rareCmd,
  renameCmd,
  searchCmd,
  sortCmd,
  statsCmd,
  syntaxCmd,
  topCmd,
  whereCmd,
} from './commands';
import {
  mathFunction,
  datetimeFunction,
  stringFunction,
  conditionFunction,
  fullTextSearchFunction,
} from './functions';
import { pplDatatypes, pplIdentifiers } from './language_structure';

export const Group1 = {
  label: 'Commands',
  options: [
    {
      label: 'Syntax',
      value: syntaxCmd,
    },
    {
      label: 'dedup',
      value: dedupCmd,
    },
    {
      label: 'eval',
      value: evalCmd,
    },
    {
      label: 'fields',
      value: fieldsCmd,
    },
    {
      label: 'rename',
      value: renameCmd,
    },
    {
      label: 'search',
      value: searchCmd,
    },
    {
      label: 'sort',
      value: sortCmd,
    },
    {
      label: 'stats',
      value: statsCmd,
    },
    {
      label: 'where',
      value: whereCmd,
    },
    {
      label: 'head',
      value: headCmd,
    },
    {
      label: 'parse',
      value: parseCmd,
    },
    {
      label: 'rare',
      value: rareCmd,
    },
    {
      label: 'top',
      value: topCmd,
    },
  ],
};

export const Group2 = {
  label: 'Functions',
  options: [
    {
      label: 'Math',
      value: mathFunction,
    },
    {
      label: 'Date and Time',
      value: datetimeFunction,
    },
    {
      label: 'String',
      value: stringFunction,
    },
    {
      label: 'Condition',
      value: conditionFunction,
    },
    {
      label: 'Full Text Search',
      value: fullTextSearchFunction,
    },
  ],
};

export const Group3 = {
  label: 'Language Structure',
  options: [
    {
      label: 'Identifiers',
      value: pplIdentifiers,
    },
    {
      label: 'Data Types',
      value: pplDatatypes,
    },
  ],
};
