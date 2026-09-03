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

import { ViewMode } from '../../../../../embeddable/public';
import { SectionEmbeddable, DashboardSectionEmbeddableInput } from './section_embeddable';

const buildInput = (
  overrides: Partial<DashboardSectionEmbeddableInput> = {}
): DashboardSectionEmbeddableInput => ({
  id: 'section-1',
  title: 'My section',
  collapsed: false,
  members: [],
  ...overrides,
});

describe('SectionEmbeddable hidePanelActions sync', () => {
  // A section has no panel actions in view mode (section actions are edit-only
  // and generic actions are suppressed via isSectionEmbeddable), so its kebab
  // would open an empty menu. The section drives the existing `hidePanelActions`
  // input flag from view mode to hide the kebab -- no shared-plugin change.

  test('constructing in view mode hides panel actions immediately', () => {
    const section = new SectionEmbeddable(buildInput({ viewMode: ViewMode.VIEW }));
    expect(section.getInput().hidePanelActions).toBe(true);
  });

  test('constructing in edit mode leaves panel actions visible', () => {
    const section = new SectionEmbeddable(buildInput({ viewMode: ViewMode.EDIT }));
    expect(Boolean(section.getInput().hidePanelActions)).toBe(false);
  });

  test('toggling edit -> view hides, and view -> edit re-shows the kebab', () => {
    const section = new SectionEmbeddable(buildInput({ viewMode: ViewMode.EDIT }));
    expect(Boolean(section.getInput().hidePanelActions)).toBe(false);

    section.updateInput({ viewMode: ViewMode.VIEW });
    expect(section.getInput().hidePanelActions).toBe(true);

    section.updateInput({ viewMode: ViewMode.EDIT });
    expect(section.getInput().hidePanelActions).toBe(false);
  });

  test('unrelated input changes in view mode do not flip the flag (no feedback loop)', () => {
    const section = new SectionEmbeddable(buildInput({ viewMode: ViewMode.VIEW }));
    expect(section.getInput().hidePanelActions).toBe(true);

    // A title-only change must not toggle hidePanelActions off, and the guard
    // must prevent an updateInput feedback loop.
    section.updateInput({ title: 'Renamed section' });
    expect(section.getInput().hidePanelActions).toBe(true);
    expect(section.getInput().title).toBe('Renamed section');
  });
});
