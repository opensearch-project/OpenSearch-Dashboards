/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILLEGAL_CHARACTERS_VISIBLE, CONTAINS_SPACES_KEY, ILLEGAL_CHARACTERS_KEY } from './types';

function datasetContainsSpaces(dataset: string): boolean {
  return dataset.includes(' ');
}

function findIllegalCharacters(dataset: string): string[] {
  const illegalCharacters = ILLEGAL_CHARACTERS_VISIBLE.reduce((chars: string[], char: string) => {
    if (dataset.includes(char)) {
      chars.push(char);
    }
    return chars;
  }, []);

  return illegalCharacters;
}

export function validateDataset(dataset: string) {
  const errors: Record<string, any> = {};

  const illegalCharacters = findIllegalCharacters(dataset);

  if (illegalCharacters.length) {
    errors[ILLEGAL_CHARACTERS_KEY] = illegalCharacters;
  }

  if (datasetContainsSpaces(dataset)) {
    errors[CONTAINS_SPACES_KEY] = true;
  }

  return errors;
}
