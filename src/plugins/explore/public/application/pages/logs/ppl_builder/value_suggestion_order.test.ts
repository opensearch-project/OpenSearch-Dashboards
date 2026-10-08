/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { compareValueSuggestions } from './value_suggestion_order';

describe('compareValueSuggestions', () => {
  it('ranks prefix matches ahead of substring matches', () => {
    expect(['test-err', 'errand', 'error', 'err'].sort(compareValueSuggestions('err'))).toEqual([
      'err',
      'error',
      'errand',
      'test-err',
    ]);
  });

  it('breaks ties by shortest then alphabetical when no query', () => {
    expect(['b', 'aa', 'a', 'cccc', 'bb'].sort(compareValueSuggestions(''))).toEqual([
      'a',
      'b',
      'aa',
      'bb',
      'cccc',
    ]);
  });

  it('ignores a leading quote from the typed value', () => {
    expect(
      ['staging', 'preprod', 'production', 'prod'].sort(compareValueSuggestions('"pro'))
    ).toEqual(['prod', 'production', 'preprod', 'staging']);
  });

  it('matches case-insensitively', () => {
    expect(['Alpha', 'beta', 'ALARM'].sort(compareValueSuggestions('al'))).toEqual([
      'ALARM',
      'Alpha',
      'beta',
    ]);
  });
});
