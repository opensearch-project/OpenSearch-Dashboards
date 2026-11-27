/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getEffectiveFields } from './get_effective_fields';

describe('getEffectiveFields', () => {
  const mapped = (name: string, type = 'string') => ({ name, type, scripted: false });
  const scripted = (name: string, script = '1') => ({ name, script, scripted: true });

  it('keeps the later entry for a name, in the position of the first', () => {
    expect(getEffectiveFields([mapped('a'), mapped('b'), scripted('a')])).toEqual([
      scripted('a'),
      mapped('b'),
    ]);
    // Like loading a saved list: a mapped field saved after a scripted one wins.
    expect(getEffectiveFields([scripted('a'), mapped('a')])).toEqual([mapped('a')]);
  });

  it('keeps the later of two entries of the same kind', () => {
    expect(getEffectiveFields([mapped('a', 'string'), mapped('a', 'number')])).toEqual([
      mapped('a', 'number'),
    ]);
    expect(getEffectiveFields([scripted('a', '1'), scripted('a', '2')])).toEqual([
      scripted('a', '2'),
    ]);
  });
});
