/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import { mount } from 'enzyme';
import { EuiBadge, EuiComboBox } from '@elastic/eui';
import { SavedObjectAnnotationService } from '../../../../core/public';
import { TagSelector } from './tag_selector';

const flushPromises = () => new Promise((resolve) => process.nextTick(resolve));

describe('TagSelector', () => {
  it('loads tags and reports the selected annotation ID', async () => {
    const annotationService = {
      findAnnotations: jest.fn().mockResolvedValue([
        {
          id: 'tag-1',
          type: 'tag',
          name: 'Production',
          payload: { color: '#54B399' },
        },
      ]),
    } as unknown as SavedObjectAnnotationService;
    const onChange = jest.fn();
    const component = mount(
      <TagSelector annotationService={annotationService} onChange={onChange} />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    const comboBox = component.find(EuiComboBox);
    expect(comboBox.prop('options')).toEqual([
      { label: 'Production', key: 'tag-1', value: 'tag-1', color: '#54B399' },
    ]);

    const renderedOption = mount(
      <>{comboBox.prop('renderOption')!(comboBox.prop('options')![0], 'prod', '')}</>
    );
    expect(renderedOption.find(EuiBadge).prop('color')).toBe('#54B399');
    expect(renderedOption.text()).toBe('Production');

    comboBox.prop('onChange')!([{ label: 'Production', value: 'tag-1' }]);
    expect(onChange).toHaveBeenCalledWith('tag-1');
  });
});
