/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { COMPAT_BLOCK_ROOT_ID, renderCompatBlockPage } from './compat_block_page';
import { EvaluatedRemote } from './compat_enforcement';

describe('renderCompatBlockPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="pre-existing">app shell</div>';
  });

  const offenders: EvaluatedRemote[] = [
    {
      id: 'data',
      compatibility: 'incompatible',
      reasons: [
        'host OSD 3.5.0 is not within the remote\'s compatible core range "3.7.x"',
        "host OSD 3.5.0 is below the remote's minimum core version 3.7.0",
      ],
    },
    {
      id: 'visualizations',
      compatibility: 'incompatible',
      reasons: ['shared singleton "react": host ^16.14.0 does not satisfy "^18.0.0"'],
    },
  ];

  it('replaces the document body with ONLY the block page (app shell removed)', () => {
    renderCompatBlockPage(offenders, document);

    expect(document.getElementById('pre-existing')).toBeNull();
    const root = document.getElementById(COMPAT_BLOCK_ROOT_ID);
    expect(root).not.toBeNull();
    expect(root!.getAttribute('data-test-subj')).toBe(COMPAT_BLOCK_ROOT_ID);
  });

  it('lists every offender id, its verdict, and each reason', () => {
    renderCompatBlockPage(offenders, document);

    const list = document.querySelector(`[data-test-subj="${COMPAT_BLOCK_ROOT_ID}_offenders"]`);
    expect(list).not.toBeNull();
    const text = list!.textContent ?? '';

    expect(text).toContain('data (incompatible)');
    expect(text).toContain('visualizations (incompatible)');
    expect(text).toContain('compatible core range "3.7.x"');
    expect(text).toContain('does not satisfy "^18.0.0"');

    // One <li> per offender at the top level of the list.
    const topLevelItems = Array.from(list!.children).filter((el) => el.tagName === 'LI');
    expect(topLevelItems).toHaveLength(2);
  });

  it('renders a generic message even with no offenders (defensive)', () => {
    renderCompatBlockPage([], document);
    const root = document.getElementById(COMPAT_BLOCK_ROOT_ID);
    expect(root).not.toBeNull();
    expect(root!.textContent).toContain('incompatible');
  });
});
