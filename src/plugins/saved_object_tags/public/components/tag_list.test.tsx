/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import { mount } from 'enzyme';
import { EuiBadge } from '@elastic/eui';
import { SavedObjectAnnotationService } from '../../../../core/public';
import { TagList } from './tag_list';

const flushPromises = () => new Promise((resolve) => process.nextTick(resolve));

describe('TagList', () => {
  it('renders caller-provided loading content', () => {
    const annotationService = {
      getAnnotationsForObject: jest.fn().mockReturnValue(new Promise(() => {})),
    } as unknown as SavedObjectAnnotationService;
    const component = mount(
      <TagList
        annotationService={annotationService}
        target={{ objectType: 'dashboard', objectId: 'dashboard-1' }}
        loadingContent={<span data-test-subj="tagListLoading">Loading</span>}
      />
    );

    expect(component.find('[data-test-subj="tagListLoading"]').first().text()).toBe('Loading');
  });

  it('loads and renders tags for the target object', async () => {
    const annotationService = {
      getAnnotationsForObject: jest.fn().mockResolvedValue([
        {
          id: 'tag-1',
          type: 'tag',
          name: 'Production',
          payload: { color: '#54B399' },
        },
      ]),
    } as unknown as SavedObjectAnnotationService;
    const component = mount(
      <TagList
        annotationService={annotationService}
        target={{ objectType: 'dashboard', objectId: 'dashboard-1' }}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    expect(annotationService.getAnnotationsForObject).toHaveBeenCalledWith({
      type: 'tag',
      target: { objectType: 'dashboard', objectId: 'dashboard-1' },
    });
    expect(component.find(EuiBadge).text()).toBe('Production');
  });

  it('reloads tags when the refresh key changes', async () => {
    const annotationService = {
      getAnnotationsForObject: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'tag-1', type: 'tag', name: 'Production' }]),
    } as unknown as SavedObjectAnnotationService;
    const component = mount(
      <TagList
        annotationService={annotationService}
        target={{ objectType: 'dashboard', objectId: 'dashboard-1' }}
        refreshKey={0}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.setProps({ refreshKey: 1 });
    await act(async () => {
      await flushPromises();
    });
    component.update();

    expect(annotationService.getAnnotationsForObject).toHaveBeenCalledTimes(2);
    expect(component.find(EuiBadge).text()).toBe('Production');
  });

  it('renders caller-provided empty content', async () => {
    const annotationService = {
      getAnnotationsForObject: jest.fn().mockResolvedValue([]),
    } as unknown as SavedObjectAnnotationService;
    const component = mount(
      <TagList
        annotationService={annotationService}
        target={{ objectType: 'dashboard', objectId: 'dashboard-1' }}
        emptyContent={<span data-test-subj="tagListEmpty">No tags</span>}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    expect(component.find('[data-test-subj="tagListEmpty"]').first().text()).toBe('No tags');
  });
});
