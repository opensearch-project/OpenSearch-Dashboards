/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewMode } from '../../../../../../embeddable/public';
import { NavAction } from '../../../../types';
import { getTopNavConfig } from './get_top_nav_config';
import { TopNavIds } from './top_nav_ids';

describe('getTopNavConfig', () => {
  const actions = Object.values(TopNavIds).reduce<Record<string, NavAction>>((result, id) => {
    result[id] = jest.fn();
    return result;
  }, {});

  it('places tags immediately after save in edit mode', () => {
    const config = getTopNavConfig(ViewMode.EDIT, actions, false);

    expect(config.map(({ testId }) => testId)).toEqual([
      'dashboardEditSwitch',
      'dashboardSaveMenuItem',
      'dashboardTagsMenuItem',
      'dashboardAddPanelButton',
      'dashboardOptionsButton',
      'shareTopNavButton',
    ]);
  });

  it('includes tags in view mode', () => {
    const config = getTopNavConfig(ViewMode.VIEW, actions, false);

    expect(config.map(({ testId }) => testId)).toEqual([
      'dashboardEditSwitch',
      'dashboardTagsMenuItem',
      'dashboardClone',
      'shareTopNavButton',
    ]);
  });

  it('includes tags in view mode when write controls are hidden', () => {
    const config = getTopNavConfig(ViewMode.VIEW, actions, true);

    expect(config.map(({ testId }) => testId)).toEqual([
      'dashboardTagsMenuItem',
      'shareTopNavButton',
    ]);
  });

  it('omits tags when no action is available', () => {
    const config = getTopNavConfig(
      ViewMode.EDIT,
      {
        ...actions,
        [TopNavIds.TAGS]: undefined,
      } as unknown as Record<string, NavAction>,
      false
    );

    expect(config.map(({ testId }) => testId)).not.toContain('dashboardTagsMenuItem');
  });
});
