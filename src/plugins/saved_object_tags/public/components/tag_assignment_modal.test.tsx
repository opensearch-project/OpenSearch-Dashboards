/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiColorPicker,
  EuiComboBox,
  EuiFieldText,
  EuiSmallButton,
} from '@elastic/eui';
import { mount } from 'enzyme';
import { SavedObjectAnnotationService } from '../../../../core/public';
import { TagAssignmentModal } from './tag_assignment_modal';

const flushPromises = () => new Promise((resolve) => process.nextTick(resolve));

const createAnnotationService = () =>
  ({
    findAnnotations: jest.fn(),
    getAnnotationsForObject: jest.fn(),
    createAnnotation: jest.fn(),
    addAnnotationToObject: jest.fn().mockResolvedValue(undefined),
    removeAnnotationFromObject: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<SavedObjectAnnotationService>;

const target = {
  objectType: 'dashboard',
  objectId: 'dashboard-1',
};

describe('TagAssignmentModal', () => {
  it('loads current assignments and saves added and removed tags', async () => {
    const annotationService = createAnnotationService();
    annotationService.findAnnotations.mockResolvedValue([
      { id: 'tag-1', type: 'tag', name: 'Production', payload: { color: '#54B399' } },
      { id: 'tag-2', type: 'tag', name: 'Executive' },
    ]);
    annotationService.getAnnotationsForObject.mockResolvedValue([
      { id: 'tag-1', type: 'tag', name: 'Production' },
    ]);
    const onClose = jest.fn();
    const onChange = jest.fn();
    const component = mount(
      <TagAssignmentModal
        annotationService={annotationService}
        target={target}
        onClose={onClose}
        onChange={onChange}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    const comboBox = component.find(EuiComboBox);
    expect(comboBox.prop('selectedOptions')).toEqual([
      expect.objectContaining({ label: 'Production', value: 'tag-1' }),
    ]);

    const renderedOption = mount(
      <>{comboBox.prop('renderOption')!(comboBox.prop('options')![0], '', '')}</>
    );
    expect(renderedOption.find(EuiBadge).prop('color')).toBe('#54B399');
    expect(renderedOption.text()).toBe('Production');

    act(() => {
      comboBox.prop('onChange')!([{ label: 'Executive', value: 'tag-2' }]);
    });
    component.update();

    await act(async () => {
      component
        .find(EuiSmallButton)
        .filterWhere((button) => button.prop('data-test-subj') === 'savedObjectTagAssignmentSave')
        .prop('onClick')!({} as React.MouseEvent<HTMLButtonElement>);
      await flushPromises();
    });

    expect(annotationService.addAnnotationToObject).toHaveBeenCalledWith({
      annotationId: 'tag-2',
      type: 'tag',
      target,
    });
    expect(annotationService.removeAnnotationFromObject).toHaveBeenCalledWith({
      annotationId: 'tag-1',
      type: 'tag',
      target,
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates and assigns a new tag when requested', async () => {
    const annotationService = createAnnotationService();
    annotationService.findAnnotations.mockResolvedValue([]);
    annotationService.getAnnotationsForObject.mockResolvedValue([]);
    annotationService.createAnnotation.mockResolvedValue({
      id: 'tag-new',
      type: 'tag',
      name: 'Production',
      payload: { color: '#54B399' },
    });
    const component = mount(
      <TagAssignmentModal
        annotationService={annotationService}
        target={target}
        onClose={() => {}}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    act(() => {
      component
        .find(EuiButtonEmpty)
        .filterWhere(
          (button) => button.prop('data-test-subj') === 'savedObjectTagAssignmentShowCreate'
        )
        .prop('onClick')!({} as React.MouseEvent<HTMLButtonElement>);
    });
    component.update();

    act(() => {
      component
        .find(EuiFieldText)
        .filterWhere((field) => field.prop('data-test-subj') === 'savedObjectTagAssignmentName')
        .prop('onChange')!({
        target: { value: 'Production' },
      } as React.ChangeEvent<HTMLInputElement>);
      component.find(EuiColorPicker).prop('onChange')!('#54B399', {
        hex: '#54B399',
        isValid: true,
        rgba: [84, 179, 153, 1],
      });
    });
    component.update();

    await act(async () => {
      component
        .find(EuiSmallButton)
        .filterWhere((button) => button.prop('data-test-subj') === 'savedObjectTagAssignmentSave')
        .prop('onClick')!({} as React.MouseEvent<HTMLButtonElement>);
      await flushPromises();
    });

    expect(annotationService.createAnnotation).toHaveBeenCalledWith({
      type: 'tag',
      name: 'Production',
      payload: { color: '#54B399' },
    });
    expect(annotationService.addAnnotationToObject).toHaveBeenCalledWith({
      annotationId: 'tag-new',
      type: 'tag',
      target,
    });
  });

  it('rejects a duplicate tag name ignoring case and surrounding whitespace', async () => {
    const annotationService = createAnnotationService();
    annotationService.findAnnotations.mockResolvedValue([
      { id: 'tag-1', type: 'tag', name: 'Production' },
    ]);
    annotationService.getAnnotationsForObject.mockResolvedValue([]);
    const component = mount(
      <TagAssignmentModal
        annotationService={annotationService}
        target={target}
        onClose={() => {}}
      />
    );

    await act(async () => {
      await flushPromises();
    });
    component.update();

    act(() => {
      component
        .find(EuiButtonEmpty)
        .filterWhere(
          (button) => button.prop('data-test-subj') === 'savedObjectTagAssignmentShowCreate'
        )
        .prop('onClick')!({} as React.MouseEvent<HTMLButtonElement>);
    });
    component.update();

    act(() => {
      component
        .find(EuiFieldText)
        .filterWhere((field) => field.prop('data-test-subj') === 'savedObjectTagAssignmentName')
        .prop('onChange')!({
        target: { value: ' production ' },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    component.update();

    expect(
      component
        .find(EuiFieldText)
        .filterWhere((field) => field.prop('data-test-subj') === 'savedObjectTagAssignmentName')
        .prop('isInvalid')
    ).toBe(true);
    expect(component.text()).toContain(
      'A tag named "Production" already exists. Select the existing tag instead.'
    );
    expect(
      component
        .find(EuiSmallButton)
        .filterWhere((button) => button.prop('data-test-subj') === 'savedObjectTagAssignmentSave')
        .prop('isDisabled')
    ).toBe(true);
    expect(annotationService.createAnnotation).not.toHaveBeenCalled();
  });
});
