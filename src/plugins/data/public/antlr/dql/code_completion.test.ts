/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import {
  booleanOperatorSuggestions,
  fieldNameWithNotSuggestions,
  notOperatorSuggestion,
  testingIndex,
} from '../shared/constants';

jest.mock('../../services', () => ({
  getUiService: () => ({
    Settings: {
      supportsEnhancementsEnabled: () => true,
    },
  }),
}));

const getSuggestionsAtPos = async (query: string, endPos: number) => {
  return await getSuggestions({
    query,
    indexPattern: testingIndex,
    position: new monaco.Position(1, endPos),
    language: '', // not relevant
    selectionEnd: 0, // not relevant
    selectionStart: 0, // not relevant
    services: { appName: 'discover' },
  });
};

const getSuggestionAtEnd = async (query: string) => {
  return await getSuggestionsAtPos(query, query.length + 1);
};

describe('Test Boolean Operators', () => {
  it('should suggest AND and OR after expression', async () => {
    expect(await getSuggestionAtEnd('field: value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT initially', async () => {
    expect(await getSuggestionAtEnd('')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionAtEnd('field: value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should not suggest NOT twice', async () => {
    expect(await getSuggestionAtEnd('not ')).not.toContainEqual(notOperatorSuggestion);
  });

  it('should suggest after multiple token search', async () => {
    expect(await getSuggestionAtEnd('field: one two three ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });

  it('should suggest after phrase value', async () => {
    expect(await getSuggestionAtEnd('field: "value" ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest after number', async () => {
    expect(await getSuggestionAtEnd('field: 123 ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should not suggest after incomplete quote', async () => {
    expect(await getSuggestionAtEnd('field: "value ')).not.toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test Boolean Operators within groups', () => {
  it('should suggest AND and OR', async () => {
    expect(await getSuggestionAtEnd('field: (value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionAtEnd('field: (value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest operator within nested group', async () => {
    expect(await getSuggestionAtEnd('field: ("one" and ("two" ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test field suggestions', () => {
  it('basic field suggestion', async () => {
    expect(await getSuggestionAtEnd('')).toStrictEqual(fieldNameWithNotSuggestions);
  });

  it('field suggestion after one term', async () => {
    expect(await getSuggestionAtEnd('field: value and ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });

  it('field suggestion within group', async () => {
    expect(await getSuggestionAtEnd('field: value and (one: "two" or ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });
});
