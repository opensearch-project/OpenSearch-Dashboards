/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { EuiCodeBlock } from '@elastic/eui';
import { stringify } from '@osd/std';
import { IndexPattern } from '../../../../../data/public';
import { JsonCodeBlock } from './json_code_block';

// OUI's Jest renderer omits highlighting and copy controls; check those options at its boundary.
jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  return { ...actual, EuiCodeBlock: jest.fn(actual.EuiCodeBlock) };
});

it('keeps JSON complete and skips highlighting only for large documents', () => {
  const hit = {
    _index: 'test-index',
    _id: 'test-id',
    _score: 1,
    _source: { message: 'hello' },
  };
  const { rerender } = render(<JsonCodeBlock hit={hit} indexPattern={{} as IndexPattern} />);
  expect(jest.mocked(EuiCodeBlock).mock.lastCall?.[0].language).toBe('json');

  const largeHit = { ...hit, _source: { message: 'x'.repeat(100000) } };
  rerender(<JsonCodeBlock hit={largeHit} indexPattern={{} as IndexPattern} />);

  expect(jest.mocked(EuiCodeBlock).mock.lastCall?.[0]).toMatchObject({
    language: undefined,
    isCopyable: true,
  });
  expect(screen.getByTestId('osdJsonCodeBlock').textContent).toBe(stringify(largeHit, null, 2));
});
