/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILLEGAL_CHARACTERS_VISIBLE, CONTAINS_SPACES_KEY, ILLEGAL_CHARACTERS_KEY } from './types';

function dataViewContainsSpaces(dataView: string): boolean {
  return dataView.includes(' ');
}

function findIllegalCharacters(dataView: string): string[] {
  const illegalCharacters = ILLEGAL_CHARACTERS_VISIBLE.reduce((chars: string[], char: string) => {
    if (dataView.includes(char)) {
      chars.push(char);
    }
    return chars;
  }, []);

  return illegalCharacters;
}

export function validateDataView(dataView: string) {
  const errors: Record<string, any> = {};

  const illegalCharacters = findIllegalCharacters(dataView);

  if (illegalCharacters.length) {
    errors[ILLEGAL_CHARACTERS_KEY] = illegalCharacters;
  }

  if (dataViewContainsSpaces(dataView)) {
    errors[CONTAINS_SPACES_KEY] = true;
  }

  return errors;
}
