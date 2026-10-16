/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';
import { mount } from 'enzyme';
import { TagListProps } from '../../../../../saved_object_tags/public';
import { DashboardTagListTooltip } from './dashboard_tag_list_tooltip';

const target = {
  objectType: 'dashboard',
  objectId: 'dashboard-1',
};

describe('DashboardTagListTooltip', () => {
  it('owns the popup dimensions and loading presentation', () => {
    const TagList = ({ loadingContent }: TagListProps) => <>{loadingContent}</>;
    const component = mount(
      <DashboardTagListTooltip TagList={TagList} target={target} refreshKey={0} />
    );

    expect(component.find(EuiLoadingSpinner).prop('size')).toBe('m');
    expect(
      component.find('[data-test-subj="dashboardTagListTooltip"]').first().prop('style')
    ).toEqual(
      expect.objectContaining({
        minWidth: 240,
        minHeight: 48,
        paddingTop: 8,
      })
    );
  });

  it('owns the empty presentation', () => {
    const TagList = ({ emptyContent }: TagListProps) => <>{emptyContent}</>;
    const component = mount(
      <DashboardTagListTooltip TagList={TagList} target={target} refreshKey={0} />
    );

    expect(component.find('[data-test-subj="dashboardTagListTooltipEmpty"]').first().text()).toBe(
      'No tags'
    );
  });
});
